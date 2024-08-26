const openFileButton = document.getElementById('open_file');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const stopButton = document.getElementById('stop');
const volumeUpButton = document.getElementById('volume_up');
const volumeDownButton = document.getElementById('volume_down');
const seekerBar = document.getElementById('seeker');
const volumeSlider = document.getElementById('volume_slider');

//open file
openFileButton.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile();

  if (filePath) {

    audio.src = filePath;
    audio.play();

    try {
        const fileBuffer = await window.fsAPI.readFile(filePath);
        const blob = new Blob([fileBuffer]);
        updateCurrentPlayingInfo(blob);
    } catch (error) {
        console.error('Error reading file:', error.message);
    }
  }
});

//play
// playButton.addEventListener('click', () => {
//     // audio.play();
//     // playButton.style.display = 'none';
//     // pauseButton.style.display = 'inline';
//     playAudio();
// });
//
// function playAudio() {
//     audio.play();
//     playButton.style.display = 'none';
//     pauseButton.style.display = 'inline';
//
// }

//pause
pauseButton.addEventListener('click', () => {
    audio.pause();
    pauseButton.style.display = 'none';
    playButton.style.display = 'inline';
});

//vol up
volumeUpButton.addEventListener('click', () => {
    audio.volume+=0.1;
});

//vol down
volumeDownButton.addEventListener('click', () => {
    audio.volume-=0.1;
});

//seeker
//https://stackoverflow.com/questions/71195367/update-position-of-seeker-i-e-html-input-type-range-while-an-audio-is-playing
audio.addEventListener("timeupdate", () => {
    if(!audio.duration)
    {
        seekerBar.value = 0;
    }
    const songProgressPercent = audio.currentTime / audio.duration * 100;
    seekerBar.value = songProgressPercent;
});

//change time in song as we jump around the seeker
seekerBar.addEventListener('input', (newCurrentTime) => {
    audio.currentTime = newCurrentTime.target.value / 100 * audio.duration;
});

volumeSlider.addEventListener('input', (newVolume) => {
    audio.volume = newVolume.target.value/100;
});
