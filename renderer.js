import * as elements from './elements.js';

let currentSongIndex = 0;
let songFiles = [];
let shuffleMode = false;
let loopMode = false;
let shuffleIndexList = [];
let folderPath;

//change time shown by the seeker
elements.audio.addEventListener("timeupdate", () => {
    //makes it so NaN does not show anymore
    if(!elements.audio.currentTime)
    {
        return;
    }

    const currentTime = elements.audio.currentTime;
    const duration = elements.audio.duration;

    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    const totalMinutes = Math.floor(duration / 60);
    const totalSeconds = Math.floor(duration % 60);

    elements.currentTimeCount.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
    elements.totalTimeCount.textContent = `${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;
});


//changes info to match currently playing song
function updateCurrentPlayingInfo(filePath) {
    window.jsmediaAPI.readTags(filePath, {
        onSuccess: function(tag) {
            var image = tag.tags.picture;
            var artist = tag.tags.artist;
            var title = tag.tags.title;

            if (title) {
                elements.currentSong.textContent = title;
            } else {
                var fileName = filePath.replace(/^.*[\\/]/, '')
                elements.currentSong.textContent = fileName;
            }

            if(artist) {
                elements.currentArtist.textContent = artist;
            } else {
                elements.currentArtist.textContent = "No given artist";
            }

            if (image) {
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
                var base64 = "data:" + image.format + ";base64," +
                window.btoa(base64String);
                elements.coverImage.setAttribute('src',base64);
                elements.coverImage.style.display = 'inline';
            } else {
                elements.coverImage.src="resources/noCover.jpg"
            }
        },
        onError: function(error) {
            //even though we have the above, this is still needed... :C
            var fileName = filePath.replace(/^.*[\\/]/, '')
            elements.currentSong.textContent = fileName;
            elements.currentArtist.textContent = "No given artist";
            elements.coverImage.src="resources/noCover.jpg"
        }
    });
}

// go to next song on audio end
elements.audio.addEventListener('ended', () => {
    playNextSong();
    seekerBar.value = 0;
});

// open folder
elements.openFolder.addEventListener('click', async () => {
    folderPath = await window.electronAPI.openFolder();
    loadFiles(folderPath);
});


// gets the song name to display in library
function getSongName(file) {
    return new Promise((resolve, reject) => {
        window.jsmediaAPI.readTags(file, {
            onSuccess: function(tag) {
                if (tag.tags.title) {
                    resolve(tag.tags.title);
                } else {
                    var fileName = file.replace(/^.*[\\/]/, '')
                    resolve(fileName);
                }
            },
            onError: function(error) {
                resolve(file);
            }
        });
    });
}

// gets the artist name to display in library
function getArtistName(file) {
    return new Promise((resolve, reject) => {
        window.jsmediaAPI.readTags(file, {
            onSuccess: function(tag) {
                if (tag.tags.artist) {
                    resolve(tag.tags.artist);
                } else {
                    resolve("No artist given");
                }
            },
            onError: function(error) {
                resolve("No artist given");
            }
        });
    });
}


// play button - plays first song if nothing is playing yet
elements.playButton.addEventListener('click', () => {
    if(!elements.audio.src)
    {
        loadAndPlaySong();
    }
    elements.audio.play();
    elements.playButton.style.display = 'none';
    elements.pauseButton.style.display = 'inline';
});

// loads and plays the song at the given index.
// if there's no index given, just plays the first
function loadAndPlaySong(index=0){
    currentSongIndex = index;
    const fullPath = `${folderPath}/${songFiles[currentSongIndex]}`;
    elements.audio.src = fullPath;
    elements.audio.play();
    elements.playButton.style.display = 'none';
    elements.pauseButton.style.display = 'inline';
    updateCurrentPlayingInfo(fullPath);
}

// function that runs on song click - turns shuffle and loop off while it's at it
function manualSongClick(index=0){
    toggleShuffle(false);
    toggleLoop(false);
    loadAndPlaySong(index)
}

// loads songs into library
async function loadFiles(folderPath) {
    songFiles = await window.electronAPI.readDirectory(folderPath);
    console.log(songFiles);

    // clears the list - commented out right now to keep all folders open
    // songList.innerHTML = '';

    for (const [index, song] of songFiles.entries()) {
        const fullPath = `${folderPath}/${song}`;

        const songInfoBox = document.createElement('div');
        songInfoBox.className = "song_infobox";

        const forceToLeft = document.createElement('div');
        forceToLeft.className = "force_to_left";
        songInfoBox.append(forceToLeft);

        songInfoBox.addEventListener('click', () => manualSongClick(index));

        const songDurationBox = document.createElement('span');
        const songDuration = await window.audioAPI.getAudioDuration(fullPath);
        const songMinutes = Math.floor(songDuration / 60);
        const songSeconds = Math.floor(songDuration % 60);
        const formattedSeconds = songSeconds < 10 ? '0' + songSeconds : songSeconds;
        songDurationBox.className = "duration";
        songDurationBox.textContent = songMinutes + ":" + formattedSeconds;
        forceToLeft.append(songDurationBox);

        const songName = document.createElement('span');
        songName.textContent = await getSongName(fullPath);
        forceToLeft.append(songName);

        const songArtist = document.createElement('span');
        songArtist.textContent = await getArtistName(fullPath);
        songInfoBox.append(songArtist);

        elements.songList.append(songInfoBox);
    }
};

// next button - turns loop off
elements.nextButton.addEventListener('click', () => {
    toggleLoop(false);
    playNextSong();
});

// plyas the next song, shuffling/looping if needed
function playNextSong(){
    let nextSongIndex;
    let firstSongIndex;
    if(shuffleMode == true)
    {
        nextSongIndex = shuffleIndexList[currentSongIndex + 1];
        firstSongIndex = shuffleIndexList[0];
    } else {
        nextSongIndex = currentSongIndex + 1;
        firstSongIndex = 0;
    }

    if(loopMode == true) {
        nextSongIndex = currentSongIndex;
    }

    if (nextSongIndex < songFiles.length) {
        loadAndPlaySong(nextSongIndex);
    } else {
        loadAndPlaySong(firstSongIndex);
    }
}

// plays previous song
elements.previousButton.addEventListener('click', () => {
    let previousSongIndex;
    if(shuffleMode == true)
    {
        previousSongIndex = shuffleIndexList[currentSongIndex - 1];
    } else {
        previousSongIndex = currentSongIndex - 1;
    }

    if (previousSongIndex >= 0) {
        loadAndPlaySong(previousSongIndex);
    }
});


// button to toggle shuffling
elements.shuffleButton.addEventListener('click', () => {
    toggleShuffle();
});

// toggles shuffle
//enter "true" into the function to turn shuffle off, otherwise it just defaults to swapping shuffling
function toggleShuffle(toggleAsNormal=true) {
    if(toggleAsNormal)
    {
        shuffleMode = !shuffleMode;
    } else {
        shuffleMode = false;
    }

    if(shuffleMode) {
        elements.shuffleButton.textContent = 'Unshuffle';
        shuffleIndexList = [];

        for(let index = 0; index < songFiles.length; index++)
        {
            shuffleIndexList.push(index);
        }

        let currentIndex = shuffleIndexList.length;
        while(currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [shuffleIndexList[currentIndex], shuffleIndexList[randomIndex]] = [shuffleIndexList[randomIndex], shuffleIndexList[currentIndex]];
        }
    } else {
        elements.shuffleButton.textContent = 'Shuffle';
    }
}

// toggles looping
// you can pass false to disable for sure - no toggling
function toggleLoop(toggleAsNormal=true){
    if(toggleAsNormal)
    {
        loopMode = !loopMode;
    } else {
        loopMode = false;
    }

    if(loopMode) {
        elements.loopButton.textContent = 'Unloop';
    } else {
        elements.loopButton.textContent = 'Loop';
    }
}

// button to toggle looping
elements.loopButton.addEventListener('click', () => {
    toggleLoop();
});


// my default folder
// this will not be hardcoded forever
folderPath = "/home/nat/pleasework/music/soundcloudthievery";
loadFiles(folderPath);


