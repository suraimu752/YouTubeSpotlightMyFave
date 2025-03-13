let live;
let arch;
let sche;

async function update(){
    let l, a, s, stl;
    if(document.getElementById("live").checked){
        l = 1;
    }
    else{
        l = 0;
    }

    if(document.getElementById("arch").checked){
        a = 1;
    }
    else{
        a = 0;
    }

    if(document.getElementById("sche").checked){
        s = 1;
    }
    else{
        s = 0;
    }

    if(document.getElementById("overflow").checked){
        stl = "overflow";
    }
    else{
        stl = "wrap";
    }
    
    await chrome.storage.local.set({
        spotlightMyFaveFlags: `${l},${a},${s},${stl}`
    });
    
    // 設定を更新した後にページをリロード
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (tab) {
        await chrome.tabs.reload(tab.id);
    }
}

window.onload = async function(){
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const currentTabUrl = tabs[0].url;
    
    if(currentTabUrl.endsWith("youtube.com/feed/subscriptions")){
        // バックグラウンドスクリプトからフラグを取得
        const flags = await new Promise(resolve => {
            chrome.runtime.sendMessage({method: "getFlags"}, response => {
                resolve(response);
            });
        });

        if(flags[0] == 0){
            document.getElementById("live").checked = false;
        }
        if(flags[1] == 0){
            document.getElementById("arch").checked = false;
        }
        if(flags[2] == 0){
            document.getElementById("sche").checked = false;
        }
        document.getElementById(flags[3]).checked = true;
    
        document.getElementById("live").addEventListener("click", update);
        document.getElementById("arch").addEventListener("click", update);
        document.getElementById("sche").addEventListener("click", update);
        document.getElementById("overflow").addEventListener("click", update);
        document.getElementById("wrap").addEventListener("click", update);
        document.getElementById("refreshBtn").addEventListener("click", update);
    }
    else{
        document.getElementsByTagName("body")[0].innerHTML = `<div id="otherPage">
        この拡張機能はYoutubeの<br>登録チャンネルのページでのみ<br>動作します。<br>
        </div>`;
    }
};
