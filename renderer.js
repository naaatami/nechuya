const audio = document.getElementById('audio');
const currentTimeCount = document.getElementById('current_time');
const totalTimeCount = document.getElementById('total_time');
const coverImage = document.getElementById('cover_image');
const currentSong = document.getElementById('song_name');
const currentArtist = document.getElementById('artist_name');
const openFolder = document.getElementById('open_folder');
const songList = document.getElementById('song_list');
const loopButton = document.getElementById('loop');
const openFileButton = document.getElementById('open_file');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const stopButton = document.getElementById('stop');
const volumeUpButton = document.getElementById('volume_up');
const volumeDownButton = document.getElementById('volume_down');
const seekerBar = document.getElementById('seeker');
const previousButton = document.getElementById('previous');
const nextButton = document.getElementById('next');
const shuffleButton = document.getElementById('shuffle');

let currentSongIndex = 0;
let songFiles = [];
let shuffleMode = false;
let loopMode = false;
let shuffleIndexList = [];
let folderPath;

//change time shown by the seeker
audio.addEventListener("timeupdate", () => {
    //makes it so NaN does not show anymore
    if(!audio.currentTime)
    {
        return;
    }

    const currentTime = audio.currentTime;
    const duration = audio.duration;

    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    const totalMinutes = Math.floor(duration / 60);
    const totalSeconds = Math.floor(duration % 60);

    currentTimeCount.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
    totalTimeCount.textContent = `${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;
});


//changes info to match currently playing song
function updateCurrentPlayingInfo(filePath) {
    window.jsmediaAPI.readTags(filePath, {
        onSuccess: function(tag) {
            var image = tag.tags.picture;
            var artist = tag.tags.artist;
            var title = tag.tags.title;

            if (title) {
                currentSong.textContent = title;
            } else {
                var fileName = filePath.replace(/^.*[\\/]/, '')
                currentSong.textContent = fileName;
            }

            if(artist) {
                currentArtist.textContent = artist;
            } else {
                currentArtist.textContent = "No given artist";
            }

            if (image) {
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
                var base64 = "data:" + image.format + ";base64," +
                window.btoa(base64String);
                coverImage.setAttribute('src',base64);
                coverImage.style.display = 'inline';
            } else {
                coverImage.src="resources/noCover.jpg"
            }
        },
        onError: function(error) {
            //even though we have the above, this is still needed... :C
            var fileName = filePath.replace(/^.*[\\/]/, '')
            currentSong.textContent = fileName;
            currentArtist.textContent = "No given artist";
            coverImage.src="resources/noCover.jpg"
        }
    });
}

// go to next song on audio end
audio.addEventListener('ended', () => {
    playNextSong();
    seekerBar.value = 0;
});

// open folder
openFolder.addEventListener('click', async () => {
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
playButton.addEventListener('click', () => {
    if(!audio.src)
    {
        loadAndPlaySong();
    }
    audio.play();
});

// loads and plays the song at the given index.
// if there's no index given, just plays the first
function loadAndPlaySong(index=0){
    currentSongIndex = index;
    const fullPath = `${folderPath}/${songFiles[currentSongIndex]}`;
    audio.src = fullPath;
    audio.play();
    playButton.style.display = 'none';
    pauseButton.style.display = 'inline';
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
    songList.innerHTML = ''; //clears list for this being opened again

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

        songList.append(songInfoBox);
    }
};

// next button - turns loop off
nextButton.addEventListener('click', () => {
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
previousButton.addEventListener('click', () => {
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
shuffleButton.addEventListener('click', () => {
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
        shuffleButton.textContent = 'Unshuffle';
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
        shuffleButton.textContent = 'Shuffle';
    }
}

// toggles looping
function toggleLoop(toggleAsNormal=true){
    if(toggleAsNormal)
    {
        loopMode = !loopMode;
    } else {
        loopMode = false;
    }

    if(loopMode) {
        loopButton.textContent = 'Unloop';
    } else {
        loopButton.textContent = 'Loop';
    }
}

// button to toggle looping
loopButton.addEventListener('click', () => {
    toggleLoop();
});

// expands cover image on click
coverImage.addEventListener('click', () => {
    coverImage.classList.toggle('cover_image_smol');
    coverImage.classList.toggle('cover_image_big');
});



//runs on start, remove eventually
// folderPath = CONFIG.defaultFolder;
folderPath = "/home/nat/pleasework/music/soundcloudthievery";
loadFiles(folderPath);


