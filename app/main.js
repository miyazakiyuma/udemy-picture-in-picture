const iconSvg = '<svg viewBox="0 0 50 50" aria-label="PiP" role="img" focusable="false" class="udlite-icon udlite-icon-medium" xmlns="http://www.w3.org/2000/svg"><path d="M22.3 34.75H39.05V21.9H22.3ZM7 40Q5.8 40 4.9 39.1Q4 38.2 4 37V11Q4 9.8 4.9 8.9Q5.8 8 7 8H41Q42.25 8 43.125 8.9Q44 9.8 44 11V37Q44 38.2 43.125 39.1Q42.25 40 41 40ZM7 37Q7 37 7 37Q7 37 7 37V11Q7 11 7 11Q7 11 7 11Q7 11 7 11Q7 11 7 11V37Q7 37 7 37Q7 37 7 37ZM7 37H41Q41 37 41 37Q41 37 41 37V11Q41 11 41 11Q41 11 41 11H7Q7 11 7 11Q7 11 7 11V37Q7 37 7 37Q7 37 7 37ZM25.3 31.75V24.9H36.05V31.75Z"/></svg>';
let isPiPMode = false;

/**
 * 処理を起動するトリガーになる要素を検出する
 * @return {Promise<HTMLVideoElement | HTMLElement>}
 */
function waitingVideoElement() {
    return new Promise((resolve, _) => {
        const fetchControl = setInterval(() => {
            const video = document.querySelector('video');
            if (video) {
                clearInterval(fetchControl);
                resolve(video);
                return;
            }
            // 動画が無い場合、「次へ」ボタンを探す
            const goToNext = document.querySelector('[data-purpose="go-to-next"]');
            if (goToNext) {
                // ペラ1コンテンツである
                const textContents = document.querySelector('[data-purpose="safely-set-inner-html:rich-text-viewer:html"]');
                if(textContents) {
                    clearInterval(fetchControl);
                    resolve(goToNext);
                    return;
                }
                // 課題である
                if (goToNext.id !== "go-to-next-item") {
                    clearInterval(fetchControl);
                    resolve(goToNext);
                    return;
                }
                // 評価をお願いしますボタンが出ている
                const rating = document.querySelector('[data-purpose="dont-ask-button"]');
                if(rating) {
                    clearInterval(fetchControl);
                    resolve(goToNext);
                    return;
                }
            }
        }, 2000);
    });
}
/**
 * @param {HTMLVideoElement} video
 */
function addPiPButton(video) {
    if(video.hasAttribute("__udemypipmark__")) {
        return;
    }
    video.setAttribute("__udemypipmark__", true);
    let parent = video.parentElement;
    let controlBar = parent.querySelector('[data-purpose="video-control-bar"]');
    let videControls = controlBar.querySelector('[data-purpose="video-controls"]');
    const div = videControls.lastChild.cloneNode(true);
    const button = div.querySelector("button");
    button.id = "";
    button.addEventListener("click", () => {
        pipModeSequence(video);
    });
    button.innerHTML = iconSvg;
    videControls.appendChild(div);
    return video;
}
/**
 * @param {HTMLVideoElement} video
 */
function pipModeSequence(video) {
    if(video.hasAttribute("__udemypip__")) return;

    isPiPMode = true;
    video.setAttribute("__udemypip__", true);
    video.requestPictureInPicture().then(_ => {
        const playButtonChange = (_) => {
            const playButton = document.querySelector('[data-purpose="play-button"]');
            playButton?.click();
        };
        const pauseButtonChange = (_) => {
            const pauseButton = document.querySelector('[data-purpose="pause-button"]');
            pauseButton?.click();
        };
        video.addEventListener('play', playButtonChange);
        video.addEventListener('pause', pauseButtonChange);
        video.addEventListener('leavepictureinpicture', a => {
            video.removeAttribute("__udemypip__");
            video.removeEventListener('play', playButtonChange);
            video.removeEventListener('pause', pauseButtonChange);
            if (document.querySelector('[__udemypip__]') === null) {
                isPiPMode = false;
                if( video.played ) {
                    // 閉じるとタブへ戻るの動作を揃える→戻ると一時停止
                    pauseButtonChange();
                }
            }
        }, { once: true });

    }).catch(_ => {
        // metadataが取れなければ一旦抜けて次のループでPiP化
        video.removeAttribute("__udemypip__");
    });
}

async function routine() {
    const actionElement = await waitingVideoElement();
    if (actionElement instanceof HTMLVideoElement) {
        addPiPButton(actionElement);
        if (isPiPMode) {
            pipModeSequence(actionElement);
        }
    } else {
        if(isPiPMode) {
            actionElement.click();
        }
    }
}

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

(async ()=>{
    while(true) {
        await routine();
        await sleep(2000);
    }
}).call();

