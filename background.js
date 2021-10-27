if(localStorage["spotlightMyFaveFlags"] == undefined) localStorage["spotlightMyFaveFlags"] = "1,1,1,overflow";

function getFlags(){
    if(localStorage["spotlightMyFaveFlags"] == undefined) localStorage["spotlightMyFaveFlags"] = "1,1,1,overflow";

    let ls = localStorage["spotlightMyFaveFlags"];
    let lsSplited = ls.split(",");
    live = parseInt(lsSplited[0]);
    arch = parseInt(lsSplited[1]);
    sche = parseInt(lsSplited[2]);
    style = lsSplited[3];

    return([live, arch, sche, style]);
}
function setFlags(live, arch, sche, style){
    localStorage["spotlightMyFaveFlags"] = `${live},${arch},${sche},${style}`;
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
