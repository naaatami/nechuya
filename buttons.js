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


//pauses audio
pauseButton.addEventListener('click', () => {
    audio.pause();
    pauseButton.style.display = 'none';
    playButton.style.display = 'inline';
});

// shows volume options on mouseover
volumeUpButton.addEventListener("mouseover", (event) => {
    volumeSlider.classList.toggle("hidden");
    var leftPosition = volumeUpButton.offsetLeft -2;
    var topPosition = volumeUpButton.offsetTop;
    console.log(topPosition);
    volumeSlider.style.position = 'absolute';
    volumeSlider.style.top = '-115px';
    volumeSlider.style.left = leftPosition + "px";
});

// shows volume options on mouseover
volumeSlider.addEventListener("mouseover", (event) => {
    volumeSlider.classList.remove("hidden");
});

// closes volume options on mouse exit
volumeSlider.addEventListener("mouseout", (event) => {
    volumeSlider.classList.add("hidden");
});

// closes volume options on mouse exit
volumeUpButton.addEventListener("mouseout", (event) => {
    volumeSlider.classList.toggle("hidden");
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

//changes volume as we slide around it
volumeSlider.addEventListener('input', (newVolume) => {
    audio.volume = newVolume.target.value/100;
});
