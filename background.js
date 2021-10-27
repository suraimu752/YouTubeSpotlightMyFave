if(localStorage["spotlightMyFaveFlags"] == undefined) localStorage["spotlightMyFaveFlags"] = "1,1,1";

function getFlags(){
    let ls = localStorage["spotlightMyFaveFlags"];
    let lsSplited = ls.split(",");
    live = parseInt(lsSplited[0]);
    arch = parseInt(lsSplited[1]);
    sche = parseInt(lsSplited[2]);

    return([live, arch, sche]);
}
function setFlags(live, arch, sche){
    localStorage["spotlightMyFaveFlags"] = `${live},${arch},${sche}`;
}

function reloadCurrentPage(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.reload(tabs[0].id);
    });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.method == "getFlags"){
            sendResponse(getFlags());
        }
        else{
            sendResponse();
        }
        return true;
    }
);