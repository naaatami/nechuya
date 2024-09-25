import * as elements from './elements.js';

//open file
elements.openFileButton.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile();

  if (filePath) {

    elements.audio.src = filePath;
    elements.audio.play();

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
elements.pauseButton.addEventListener('click', () => {
    elements.audio.pause();
    elements.pauseButton.style.display = 'none';
    elements.playButton.style.display = 'inline';
});

// shows volume options on mouseover
elements.volumeUpButton.addEventListener("mouseover", (event) => {
    volumeSlider.classList.toggle("hidden");
    var leftPosition = volumeUpButton.offsetLeft -2;
    var topPosition = volumeUpButton.offsetTop;
    elements.volumeSlider.style.position = 'absolute';
    elements.volumeSlider.style.top = '-115px';
    elements.volumeSlider.style.left = leftPosition + "px";
});

// shows volume options on mouseover
elements.volumeSlider.addEventListener("mouseover", (event) => {
    elements.volumeSlider.classList.remove("hidden");
});

// closes volume options on mouse exit
elements.volumeSlider.addEventListener("mouseout", (event) => {
    elements.volumeSlider.classList.add("hidden");
});

// closes volume options on mouse exit
elements.volumeUpButton.addEventListener("mouseout", (event) => {
    elements.volumeSlider.classList.toggle("hidden");
});


//seeker
//https://stackoverflow.com/questions/71195367/update-position-of-seeker-i-e-html-input-type-range-while-an-audio-is-playing
elements.audio.addEventListener("timeupdate", () => {
    if(!elements.audio.duration)
    {
        elements.seekerBar.value = 0;
    }
    const songProgressPercent = audio.currentTime / audio.duration * 100;
    elements.seekerBar.value = songProgressPercent;
});

//change time in song as we jump around the seeker
elements.seekerBar.addEventListener('input', (newCurrentTime) => {
    elements.audio.currentTime = newCurrentTime.target.value / 100 * elements.audio.duration;
});

//changes volume as we slide around it
elements.volumeSlider.addEventListener('input', (newVolume) => {
    elements.audio.volume = newVolume.target.value/100;
});

// expands cover image on click
elements.coverImage.addEventListener('click', () => {
    elements.coverImage.classList.toggle('cover_image_smol');
    elements.coverImage.classList.toggle('cover_image_big');
});
