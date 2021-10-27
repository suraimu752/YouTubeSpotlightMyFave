// localStorageの初期化
if(localStorage["spotlightMyFave"] == undefined) localStorage["spotlightMyFave"] = "";
function isExists(cid){
    let ls = localStorage["spotlightMyFave"].split(",");
    if(ls.indexOf(cid) != -1) return true;
    else return false;
}

function add(cid){
    let ls = localStorage["spotlightMyFave"].split(",");
    if(!ls.length) ls = [cid];
    else ls.push(cid);
    localStorage["spotlightMyFave"] = ls.join(",");
}

function remove(cid){
    let ls = localStorage["spotlightMyFave"].split(",");
    ls = ls.filter(s => s != cid);
    localStorage["spotlightMyFave"] = ls.join(",");
}

function getFlags(){
    return new Promise(function(resolve, reject){
        chrome.runtime.sendMessage({method: "getFlags"}, function(response){
            resolve(response);
        });
    })
}

// 推し登録されてるチャンネルの動画があったら先頭に移動
function findMyFave(){
    document.getElementById("title-container").insertAdjacentHTML("beforebegin", 
        `<ytd-grid-renderer id="spotlightRenderer" class="style-scope ytd-shelf-renderer"
        style="
        display: flex; flex-direction: row; margin-bottom: 20px; overflow-x: scroll;
        "></ytd-grid-renderer>`);

    let live, arch, sche;
    getFlags().then((response) => {
        live = response[0];
        arch = response[1];
        sche = response[2];
        $("ytd-grid-video-renderer.ytd-grid-renderer").each(function(i, o){
            if(isExists($(o).find(".yt-simple-endpoint.style-scope.yt-formatted-string").attr("href").split("/").slice(-1)[0])){
                if(live && !$(o).find("#video-badges").attr("hidden")){
                    $("#spotlightRenderer").prepend(o);
                }
                if(arch && $(o).find("#video-badges").attr("hidden") && !($(o).find("ytd-toggle-button-renderer").length)){
                    $("#spotlightRenderer").prepend(o);
                }
                if(sche && $(o).find("ytd-toggle-button-renderer").length){
                    $("#spotlightRenderer").prepend(o);
                }
            }
        });
    });
}

setFave = "<div id='setFave' hidden><img style='padding-top: 2px;' src=" + chrome.runtime.getURL("imgs/addFave.png") + " width='35px' height='35px'></div>";
removeFave = "<div id='removeFave' hidden><img style='padding-top: 2px;' src=" + chrome.runtime.getURL("imgs/remFave.png") + " width='35px' height='35px'></div>";

let myStyle = `
#spotlightRenderer::-webkit-scrollbar-thumb {
    height: 56px;
    border-radius: 8px;
    border: 4px solid transparent;
    background-clip: content-box;
    background-color: var(--yt-spec-text-secondary);
}
#spotlightRenderer::-webkit-scrollbar {
    width: 16px;
}
`
var newStyle = document.createElement('style');
newStyle.type = 'text/css';
// CSSの内容を書く
newStyle.innerText = myStyle;

function initialize(){
    if(location.href.endsWith("subscriptions")){
        findMyFave();
    }
    else{
        urls = location.href.split("/");
        // チャンネルIDをカスタムしてる場合は   youtube.com/c/[channelID]
        // カスタムしていなければ               youtube.com/channel/[channelID]
        if(urls[3].indexOf("c") != -1){
            let cid = urls[4];
            $("#other-buttons").append(removeFave);
            $("#other-buttons").append(setFave);
            $("#removeFave").on("click", () => {
                $("#removeFave").attr("hidden", "hidden");
                $("#setFave").removeAttr("hidden");
                remove(cid);
            });
            $("#setFave").on("click", () => {
                $("#setFave").attr("hidden", "hidden");
                $("#removeFave").removeAttr("hidden");
                add(cid);
            });
            if(isExists(cid)){
                $("#removeFave").removeAttr("hidden");
            }
            else{
                $("#setFave").removeAttr("hidden");
            }
        }
    }
}

// yt-page-navigation-progressが読み込まれるまでループ
const jsInitCheckTimer = setInterval(jsLoaded, 300);
function jsLoaded() {
    if (document.getElementsByTagName("yt-page-navigation-progress")[0] != null) {
        clearInterval(jsInitCheckTimer);
        
        initialize();
        
        // youtubeは他のページに移動する際に検索バーやサイドバーは再読み込みしない 
        // ページ移動検出用 pageNavigation要素がhiddenになったら遷移完了
        var pageNavigation = document.getElementsByTagName("yt-page-navigation-progress")[0];
        let observer1 = new MutationObserver(function(){
            if(pageNavigation.getAttribute("hidden") == ""){
                initialize();
            }
        });
        const config1 = {attributes: true};
        observer1.observe(pageNavigation, config1);
    }
}
