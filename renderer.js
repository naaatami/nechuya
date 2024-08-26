const audio = document.getElementById('audio');
const currentTimeCount = document.getElementById('current_time');
const totalTimeCount = document.getElementById('total_time');
const coverImage = document.getElementById('cover_image');
const currentSong = document.getElementById('song_name');
const currentArtist = document.getElementById('artist_name');
const openFolder = document.getElementById('open_folder');
const songList = document.getElementById('song_list');

// might be removable eventually
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
let shuffleIndexList = [];
let folderPath;

//change time
audio.addEventListener("timeupdate", () => {
    // this adds a little delay, BUT it makes it so NaN does not show anymore
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
            // console.log(tag);

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

audio.addEventListener('ended', () => {
    playNextSong();
    seekerBar.value = 0;
});

openFolder.addEventListener('click', async () => {
    folderPath = await window.electronAPI.openFolder();
    loadFiles(folderPath);
});

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


//play
playButton.addEventListener('click', () => {
    loadAndPlaySong();
});

//defaults to just playing first song :D yippee
function loadAndPlaySong(index=0){
    currentSongIndex = index;
    const fullPath = `${folderPath}/${songFiles[currentSongIndex]}`;
    // console.log(index);
    // console.log(currentSongIndex);
    // console.log(folderPath);
    // console.log(songFiles);
    // console.log(songFiles[currentSongIndex]);
    // console.log(fullPath);
    audio.src = fullPath;
    audio.play();
    playButton.style.display = 'none';
    pauseButton.style.display = 'inline';
    updateCurrentPlayingInfo(fullPath);
}


async function loadFiles(folderPath) {
    songFiles = await window.electronAPI.readDirectory(folderPath);
    console.log(songFiles);
    songList.innerHTML = ''; //clears list for this being opened again

    for (const [index, song] of songFiles.entries()) {
        const fullPath = `${folderPath}/${song}`;

        const songInfoBox = document.createElement('div');
        songInfoBox.className = "song_infobox";
        songInfoBox.addEventListener('click', () => loadAndPlaySong(index));

        const songName = document.createElement('span');
        songName.textContent = await getSongName(fullPath);
        songInfoBox.append(songName);

        const songArtist = document.createElement('span');
        songArtist.textContent = await getArtistName(fullPath);
        songInfoBox.append(songArtist);

        /*const songDuration = document.createElement('span');
         *      songDuration.textContent =*/

        songList.append(songInfoBox);
    }

    // NOT USING THIS FOR NOW but a vague paralleized idea
    // const songInfoPromises = songFiles.map(async(song) => {
    //     const fullPath = `${folderPath}/${song}`;
    //     const songName = await getSongName(fullPath);
    //     const songArtist = await getArtistName(fullPath);
    //     console.log(songArtist);
    //     console.log(songName);
    //     return {fullPath, songName, songArtist};
    // });
    //
    // const songInfoDump = await Promise.all(songInfoPromises);
    //
    // let index = 0;
    // songInfoDump.forEach(({fullPath, songName, songArtist}) => {
    //     // console.log("!!!");
    //     const songInfoBox = document.createElement('div');
    //     songInfoBox.className = "song_infobox";
    //     console.log(index);
    //     songInfoBox.addEventListener('click', () => loadAndPlaySong(index));
    //
    //     const songNameBox = document.createElement('span');
    //     songNameBox.textContent = songName;
    //     songInfoBox.append(songName);
    //
    //     const songArtistBox = document.createElement('span');
    //     songArtistBox.textContent = songArtist;
    //     songInfoBox.append(songArtist);
    //
    //     songList.append(songInfoBox);
    //     index++;
    //
    // });
};

nextButton.addEventListener('click', () => {
    playNextSong();
});

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

    if (nextSongIndex < songFiles.length) {
        loadAndPlaySong(nextSongIndex);
    } else {
        loadAndPlaySong(firstSongIndex);
        console.log("loopinggg :3 - sarahunh0ly");
    }
}

previousButton.addEventListener('click', () => {
    let previousSongIndex = currentSongIndex - 1;
    if (previousSongIndex >= 0) {
        loadAndPlaySong(previousSongIndex);
    }
});


// this doES NOT WORK AND IS HORRIBLY MADE
// WELL THIS FUNCTION DOES WORK BUT IF YOU LOOK AT HOW IT'S INTEGRATED INTO THE PROGRAM, NO THE FUCK IT IS NOT
shuffleButton.addEventListener('click', () => {
    shuffleMode = !shuffleMode;

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


});

coverImage.addEventListener('click', () => {
   if(coverImage.classList.contains('cover_image_smol')) {
       coverImage.classList.add('cover_image_big');
       coverImage.classList.remove('cover_image_smol');
   } else {
       coverImage.classList.add('cover_image_smol');
       coverImage.classList.remove('cover_image_big');
   }
});



//runs on start, remove eventually
// audio.src = '/home/cyuu/pleasework/music/soundcloudthievery/YARIMOV x Lieless - della bestia.mp3';
// updateCurrentPlayingInfo(file);
const file = '/home/nat/pleasework/music/soundcloudthievery/YARIMOV x Lieless - della bestia.mp3';
folderPath = "/home/nat/pleasework/music/soundcloudthievery";
loadFiles(folderPath);


