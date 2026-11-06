import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  computed,
  input,
  signal,
} from '@angular/core';
import { TrainingVideoCaption } from '../../../datatype'; // path apne project ke hisaab se badlo

interface VpPrefs {
  vol?: number;
  muted?: boolean;
  rate?: number;
}

const VP_PREF_KEY = 'gfu_vp';

@Component({
  selector: 'app-video-player',
  standalone: true,
  templateUrl: './video-player.html',
  styleUrl: './video-player.scss',
})
export class VideoPlayer implements AfterViewInit, OnDestroy {
  /* ---------- inputs ---------- */
  readonly src = input.required<string>();
  readonly videoTitle = input('');
  readonly captions = input<TrainingVideoCaption[]>([]);
  readonly demoNote = input(''); // khali = tag nahi dikhega
  readonly errorTitle = input('Video could not be loaded');
  readonly errorText = input('Check the link or try again in a moment.');

  @ViewChild('root', { static: true }) private rootRef!: ElementRef<HTMLDivElement>;
  @ViewChild('vid', { static: true }) private vidRef!: ElementRef<HTMLVideoElement>;

  /* ---------- state ---------- */
  readonly playing = signal(false);
  readonly ended = signal(false);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly current = signal(0);
  readonly duration = signal(0);
  readonly buffered = signal(0); // %
  readonly muted = signal(false);
  readonly volume = signal(1);
  readonly rate = signal(1);
  readonly menuOpen = signal(false);
  readonly ccIndex = signal(-1); // -1 = off
  readonly trackList = signal<{ label: string }[]>([]);
  readonly pfs = signal(false); // page ke andar full-viewport (backup fullscreen)
  readonly fsNative = signal(false);
  readonly idle = signal(false);
  readonly hoverPct = signal(0);
  readonly hoverText = signal('0:00');

  readonly rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  readonly pipOk =
    typeof document !== 'undefined' &&
    !!document.pictureInPictureEnabled &&
    typeof HTMLVideoElement !== 'undefined' &&
    'requestPictureInPicture' in HTMLVideoElement.prototype;

  readonly hasCC = computed(() => this.captions().length > 0);
  readonly pct = computed(() => (this.duration() > 0 ? (this.current() / this.duration()) * 100 : 0));
  readonly isFull = computed(() => this.fsNative() || this.pfs());
  readonly volLevel = computed(() =>
    this.muted() || this.volume() === 0 ? 'm' : this.volume() < 0.5 ? 'l' : 'h',
  );

  private clickTimer?: ReturnType<typeof setTimeout>;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private errTimer?: ReturnType<typeof setTimeout>;
  private dragging = false;

  private get vid(): HTMLVideoElement {
    return this.vidRef.nativeElement;
  }
  private get root(): HTMLDivElement {
    return this.rootRef.nativeElement;
  }

  /* ---------- lifecycle ---------- */
  ngAfterViewInit(): void {
    const v = this.vid;
    let pref: VpPrefs = {};
    try {
      pref = JSON.parse(localStorage.getItem(VP_PREF_KEY) || '{}') || {};
    } catch {
      /* ignore */
    }
    v.volume = pref.vol ?? 1;
    v.muted = !!pref.muted;
    v.playbackRate = pref.rate || 1;
    this.volume.set(v.volume);
    this.muted.set(v.muted);
    this.rate.set(v.playbackRate);

    // 12 sec me metadata na aaye to error dikhao
    this.errTimer = setTimeout(() => {
      if (v.readyState < 1) {
        this.loading.set(false);
        this.error.set(true);
      }
    }, 12000);

    this.loading.set(true);
    v.play().catch(() => this.loading.set(false));
    this.root.focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    clearTimeout(this.clickTimer);
    clearTimeout(this.idleTimer);
    clearTimeout(this.errTimer);
    this.vid.pause();
    if (document.fullscreenElement === this.root) document.exitFullscreen?.();
  }

  /* ---------- helpers ---------- */
  tf(sec: number): string {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ss = String(s).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  }

  round(n: number): number {
    return Math.round(n);
  }

  private savePrefs(): void {
    const v = this.vid;
    try {
      localStorage.setItem(
        VP_PREF_KEY,
        JSON.stringify({ vol: v.volume, muted: v.muted, rate: v.playbackRate }),
      );
    } catch {
      /* ignore */
    }
  }

  private tracks(): TextTrack[] {
    return Array.from(this.vid.textTracks).filter((t) => t.kind === 'subtitles');
  }

  /* ---------- video events ---------- */
  sync(): void {
    const v = this.vid;
    const d = isFinite(v.duration) ? v.duration : 0;
    this.current.set(v.currentTime);
    this.duration.set(d);
    if (d > 0 && v.buffered.length) {
      let end = 0;
      for (let i = 0; i < v.buffered.length; i++) {
        if (v.buffered.start(i) <= v.currentTime) end = Math.max(end, v.buffered.end(i));
      }
      this.buffered.set((end / d) * 100);
    }
  }

  onMeta(): void {
    clearTimeout(this.errTimer);
    this.error.set(false);
    this.loading.set(false);
    this.sync();
    // default caption track ho to uska index nikalo
    this.ccIndex.set(this.tracks().findIndex((t) => t.mode === 'showing'));
  }

  onPlayState(): void {
    this.playing.set(!this.vid.paused && !this.vid.ended);
    this.ended.set(this.vid.ended);
    this.wake();
  }

  onEnded(): void {
    this.playing.set(false);
    this.ended.set(true);
    this.wake();
  }

  onVolume(): void {
    this.muted.set(this.vid.muted);
    this.volume.set(this.vid.volume);
    this.rate.set(this.vid.playbackRate);
    this.savePrefs();
  }

  onRate(): void {
    this.rate.set(this.vid.playbackRate);
    this.savePrefs();
  }

  onError(): void {
    this.loading.set(false);
    this.error.set(true);
  }

  /* ---------- actions ---------- */
  toggle(): void {
    const v = this.vid;
    if (v.ended) v.currentTime = 0;
    if (v.paused || v.ended) v.play().catch(() => undefined);
    else v.pause();
  }

  seek(t: number): void {
    const v = this.vid;
    if (isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(v.duration, t));
  }

  toggleMute(): void {
    const v = this.vid;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.5;
  }

  onVolInput(value: string): void {
    const v = this.vid;
    v.volume = +value;
    v.muted = v.volume === 0;
  }

  toggleCC(): void {
    if (!this.hasCC()) return;
    this.setCC(this.tracks().some((t) => t.mode === 'showing') ? -1 : 0);
  }

  setCC(i: number): void {
    this.tracks().forEach((t, j) => (t.mode = j === i ? 'showing' : 'disabled'));
    this.ccIndex.set(i);
  }

  setRate(r: number): void {
    this.vid.playbackRate = r;
    this.rate.set(r);
  }

  togglePip(): void {
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => undefined);
    else this.vid.requestPictureInPicture().catch(() => undefined);
  }

  toggleMenu(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
    } else {
      this.trackList.set(this.tracks().map((t, i) => ({ label: t.label || 'Track ' + (i + 1) })));
      this.menuOpen.set(true);
    }
    this.wake();
  }

  toggleFs(): void {
    const el = this.root as HTMLDivElement & { webkitRequestFullscreen?: () => void };
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };
    if (this.pfs()) {
      this.pfs.set(false);
      this.wake();
      return;
    }
    if (document.fullscreenElement || doc.webkitFullscreenElement) {
      (document.exitFullscreen || doc.webkitExitFullscreen)?.call(document);
      return;
    }
    // browser fullscreen na de to page ke andar full-viewport
    const fallback = () => this.pfs.set(true);
    try {
      if (document.fullscreenEnabled === false) fallback();
      else if (el.requestFullscreen) el.requestFullscreen().catch(fallback);
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else fallback();
    } catch {
      fallback();
    }
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  onFsChange(): void {
    const doc = document as Document & { webkitFullscreenElement?: Element };
    this.fsNative.set((document.fullscreenElement || doc.webkitFullscreenElement) === this.root);
    this.wake();
  }

  /* ---------- idle (fullscreen me controls auto-hide) ---------- */
  wake(): void {
    this.idle.set(false);
    clearTimeout(this.idleTimer);
    if (!this.vid.paused && !this.menuOpen()) {
      this.idleTimer = setTimeout(() => this.idle.set(true), 2600);
    }
  }

  /* ---------- click: single = play/pause, double = fullscreen ---------- */
  onVideoClick(): void {
    this.menuOpen.set(false);
    clearTimeout(this.clickTimer);
    this.clickTimer = setTimeout(() => this.toggle(), 230);
  }

  onVideoDbl(): void {
    clearTimeout(this.clickTimer);
    this.toggleFs();
  }

  onRootPointerDown(e: PointerEvent): void {
    if (!(e.target as HTMLElement).closest('.vp-sw')) this.menuOpen.set(false);
    this.wake();
  }

  /* ---------- seek bar ---------- */
  private ratioAt(e: PointerEvent, bar: HTMLElement): number {
    const r = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  }

  onSeekDown(e: PointerEvent): void {
    const bar = e.currentTarget as HTMLElement;
    this.dragging = true;
    bar.setPointerCapture(e.pointerId);
    this.seek(this.ratioAt(e, bar) * this.vid.duration);
  }

  onSeekMove(e: PointerEvent): void {
    const p = this.ratioAt(e, e.currentTarget as HTMLElement);
    this.hoverPct.set(p * 100);
    this.hoverText.set(this.tf(p * (this.vid.duration || 0)));
    if (this.dragging) this.seek(p * this.vid.duration);
  }

  onSeekUp(): void {
    this.dragging = false;
  }

  onSeekKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') this.seek(this.vid.currentTime - 5);
    else if (e.key === 'ArrowRight') this.seek(this.vid.currentTime + 5);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  /* ---------- keyboard shortcuts ---------- */
  onKey(e: KeyboardEvent): void {
    const t = e.target as HTMLElement;
    const k = e.key;
    if (t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return;
    if (t.tagName === 'BUTTON' && (k === ' ' || k === 'Enter')) return;

    if (k === 'Escape' && this.pfs()) {
      this.pfs.set(false);
      e.preventDefault();
      e.stopPropagation(); // modal band na ho
      return;
    }

    const v = this.vid;
    const L = k.toLowerCase();
    let handled = true;
    if (k === ' ' || L === 'k') this.toggle();
    else if (k === 'ArrowLeft' || L === 'j') this.seek(v.currentTime - (L === 'j' ? 10 : 5));
    else if (k === 'ArrowRight' || L === 'l') this.seek(v.currentTime + (L === 'l' ? 10 : 5));
    else if (k === 'ArrowUp') {
      v.muted = false;
      v.volume = Math.min(1, v.volume + 0.1);
    } else if (k === 'ArrowDown') v.volume = Math.max(0, v.volume - 0.1);
    else if (L === 'm') v.muted = !v.muted;
    else if (L === 'f') this.toggleFs();
    else if (L === 'c' && this.hasCC()) this.toggleCC();
    else if (k === 'Home') this.seek(0);
    else if (k === 'End') this.seek(v.duration);
    else if (/^[0-9]$/.test(k)) this.seek((v.duration * +k) / 10);
    else handled = false;

    if (handled) {
      e.preventDefault();
      this.wake();
    }
  }
}