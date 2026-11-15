let audioContext: AudioContext | null = null;

function tone(frequency:number,duration:number,wave:OscillatorType="triangle",volume=0.045):void {
  if(typeof window==="undefined")return;
  const AudioCtor=window.AudioContext;
  if(!AudioCtor)return;
  audioContext ??= new AudioCtor();
  const context=audioContext;
  if(context.state==="suspended")void context.resume();
  const oscillator=context.createOscillator();
  const gain=context.createGain();
  const now=context.currentTime;
  oscillator.type=wave;
  oscillator.frequency.setValueAtTime(frequency,now);
  gain.gain.setValueAtTime(0.0001,now);
  gain.gain.exponentialRampToValueAtTime(volume,now+0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now+duration+0.02);
}

export function playCardSound():void { tone(420,0.07,"sine",0.025); }
export function playComboSound(size:number):void {
  const notes=size>=5?[523,659,784,1046]:size>=4?[440,554,659]:[392,494];
  notes.forEach((note,index)=>window.setTimeout(()=>tone(note,0.16,"triangle",0.04),index*55));
}
export function playRewardSound():void {
  [523,659,784,1046].forEach((note,index)=>window.setTimeout(()=>tone(note,0.22,"sine",0.045),index*75));
}
export function playErrorSound():void { tone(170,0.14,"square",0.025); }
