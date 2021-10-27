let live;
let arch;
let sche;

function update(){
    let l, a, s;
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
    chrome.extension.getBackgroundPage().setFlags(l, a, s);
}


window.onload = function(){
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){   
        var currentTabUrl = tabs[0].url;
        if(currentTabUrl.endsWith("youtube.com/feed/subscriptions")){
            let flags = chrome.extension.getBackgroundPage().getFlags();

            if(flags[0] == 0){
                document.getElementById("live").checked = false;
            }
            if(flags[1] == 0){
                document.getElementById("arch").checked = false;
            }
            if(flags[2] == 0){
                document.getElementById("sche").checked = false;
            }
        
            document.getElementById("live").addEventListener("click", () => {
                update();
            });
            document.getElementById("arch").addEventListener("click", () => {
                update();
            });
            document.getElementById("sche").addEventListener("click", () => {
                update();
            });
            document.getElementById("refreshBtn").addEventListener("click", () => {
                chrome.extension.getBackgroundPage().reloadCurrentPage();
            });
        }
        else{
            document.getElementsByTagName("body")[0].innerHTML = `<div id="otherPage">
            この拡張機能はYoutubeの<br>登録チャンネルのページでのみ<br>動作します。<br>
            </div>`;
        }
    });
};