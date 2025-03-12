// デフォルト設定の初期化
chrome.storage.local.get(['spotlightMyFaveFlags'], function(result) {
    if (!result.spotlightMyFaveFlags) {
        chrome.storage.local.set({spotlightMyFaveFlags: "1,1,1,overflow"});
    }
});

async function getFlags(){
    const result = await chrome.storage.local.get(['spotlightMyFaveFlags']);
    if (!result.spotlightMyFaveFlags) {
        await chrome.storage.local.set({spotlightMyFaveFlags: "1,1,1,overflow"});
        return [1, 1, 1, "overflow"];
    }

    const lsSplited = result.spotlightMyFaveFlags.split(",");
    const live = parseInt(lsSplited[0]);
    const arch = parseInt(lsSplited[1]);
    const sche = parseInt(lsSplited[2]);
    const style = lsSplited[3];

    return [live, arch, sche, style];
}

async function setFlags(live, arch, sche, style){
    await chrome.storage.local.set({
        spotlightMyFaveFlags: `${live},${arch},${sche},${style}`
    });
}

async function reloadCurrentPage(){
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (tab) {
        await chrome.tabs.reload(tab.id);
    }
}

// Service Worker用のメッセージハンドラー
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.method == "getFlags"){
            getFlags().then(flags => {
                sendResponse(flags);
            });
            return true; // 非同期レスポンスのために必要
        }
        return false;
    }
);
