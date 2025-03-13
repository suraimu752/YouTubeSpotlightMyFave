let initFlag = false;

// chrome.storage.localの初期化と使用
async function isExists(cid){
    const result = await chrome.storage.local.get(['spotlightMyFave']);
    const favorites = result.spotlightMyFave || "";
    const ls = favorites.split(",");
    return ls.indexOf(cid) !== -1;
}

async function add(cid){
    const result = await chrome.storage.local.get(['spotlightMyFave']);
    let favorites = result.spotlightMyFave || "";
    let ls = favorites.split(",");
    if(!ls[0]) ls = [cid];
    else ls.push(cid);
    await chrome.storage.local.set({spotlightMyFave: ls.join(",")});
}

async function remove(cid){
    const result = await chrome.storage.local.get(['spotlightMyFave']);
    let favorites = result.spotlightMyFave || "";
    let ls = favorites.split(",");
    ls = ls.filter(s => s != cid);
    await chrome.storage.local.set({spotlightMyFave: ls.join(",")});
}

function getFlags(){
    return new Promise(function(resolve, reject){
        chrome.runtime.sendMessage({method: "getFlags"}, function(response){
            resolve(response);
        });
    })
}

// DOMの準備ができてからjQueryを実行
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

$(window).on('load resize', async () => {
    await waitForElement('#contents');
    await waitForElement('#spotlightWrapper');
    await waitForElement('#spotlightRenderer');
    
    const spotlightWrapper = $("#spotlightWrapper");
    const spotlightRenderer = $("#spotlightRenderer");
    const contents = $("#contents");
    
    if (spotlightWrapper.length && contents.length) {
        spotlightWrapper.height(308 * Math.floor(spotlightRenderer.height() / 308));
        spotlightWrapper.width(contents.width());
    }
});

// 推し登録されてるチャンネルの動画があったら先頭にコピー
async function findMyFave(){
    await waitForElement('#title-container');
    
    $("#title-container").before(`<div id="spotlightWrapper" style="width: 308px;"></div>`);
    $("#spotlightWrapper").append(`<ytd-rich-grid-renderer id="spotlightRenderer"></ytd-rich-grid-renderer>`);

    let live, arch, sche, style;
    const response = await getFlags();
    live = response[0];
    arch = response[1];
    sche = response[2];
    style = response[3];

    const spotlightWrapper = $("#spotlightWrapper");
    const spotlightRenderer = $("#spotlightRenderer");

    // 高さの設定を関数化
    const updateHeight = () => {
        const itemHeight = 308;
        const itemWidth = 308;
        const items = spotlightRenderer.find('ytd-rich-item-renderer');
        const itemCount = items.length;
        const containerWidth = $("#contents").width();
        
        if (itemCount > 0) {
            if (style === "wrap") {
                const itemsPerRow = Math.floor(containerWidth / itemWidth);
                const rows = Math.ceil(itemCount / itemsPerRow);
                spotlightWrapper.height(itemHeight * rows);
                spotlightWrapper.width(containerWidth);
            } else {
                // overflowモードの場合、高さは固定
                spotlightWrapper.height(itemHeight);
                // rendererの幅を設定（アイテム数 × アイテムの幅）
                const totalWidth = Math.max(containerWidth, (itemCount * itemWidth) - 8);
                spotlightRenderer.width(totalWidth);
                // wrapperの幅を厳密に制限
                spotlightWrapper.css({
                    'width': containerWidth + 'px',
                    'max-width': containerWidth + 'px'
                });
            }
        }
    };

    // 表示周り
    if(style == "overflow"){
        spotlightWrapper.css({
            "padding-bottom": "50px",
            "margin-top": "25px",
            "overflow-x": "auto", // 横スクロールを有効化
            "overflow-y": "hidden", // 縦スクロールを無効化
            "scroll-behavior": "smooth", // スムーズスクロール
            "position": "relative" // 子要素の位置決めの基準点
        });
        spotlightRenderer.css({
            "display": "flex",
            "flex-wrap": "nowrap", // 折り返し防止
            "min-height": "308px", // 最小高さを設定
            "overflow": "visible" // スクロールをwrapperに移動
        });

        // ボタンを追加
        $("body").append(`
            <div id='spotlightLeftBtn' class='spotlightBtn' style='position: fixed; z-index: 2000; cursor: pointer;'>&lt;</div>
            <div id='spotlightRightBtn' class='spotlightBtn' style='position: fixed; z-index: 2000; cursor: pointer;'>&gt;</div>
        `);

        // ボタンの位置を更新する関数
        const updateButtonPositions = () => {
            const wrapperRect = spotlightWrapper[0].getBoundingClientRect();
            
            $("#spotlightLeftBtn").css({
                left: wrapperRect.left + 'px',
                top: wrapperRect.top + (wrapperRect.height / 2) + 'px',
                transform: 'translateY(-50%)'
            });
            $("#spotlightRightBtn").css({
                right: '0px',
                top: wrapperRect.top + (wrapperRect.height / 2) + 'px',
                transform: 'translateY(-50%)'
            });
        };

        // 初期位置設定
        updateButtonPositions();
        
        // スクロールとリサイズ時に位置を更新
        $(window).on('scroll resize', updateButtonPositions);

        spotlightRenderer.addClass("overflow");

        $(document).on("click", "#spotlightLeftBtn", function() {
            const scrollAmount = spotlightWrapper.width() * 0.8;
            spotlightWrapper.stop().animate({
                scrollLeft: spotlightWrapper.scrollLeft() - scrollAmount
            }, {
                duration: 200,
                easing: 'linear'
            });
            return false;
        });

        $(document).on("click", "#spotlightRightBtn", function() {
            const scrollAmount = spotlightWrapper.width() * 0.8;
            spotlightWrapper.stop().animate({
                scrollLeft: spotlightWrapper.scrollLeft() + scrollAmount
            }, {
                duration: 200,
                easing: 'linear'
            });
            return false;
        });

        // スクロールイベントの最適化
        let scrollTimeout;
        spotlightWrapper.on("scroll", function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const left = spotlightWrapper.scrollLeft();
                const scrollWidth = spotlightWrapper[0].scrollWidth;
                const clientWidth = spotlightWrapper[0].clientWidth;
                const maxScroll = scrollWidth - clientWidth;

                // 左ボタンの表示制御
                if (left > 10) {
                    $("#spotlightLeftBtn").fadeIn(200);
                } else {
                    $("#spotlightLeftBtn").fadeOut(200);
                }

                // 右ボタンの表示制御
                if (left < maxScroll - 10) {
                    $("#spotlightRightBtn").fadeIn(200);
                } else {
                    $("#spotlightRightBtn").fadeOut(200);
                }
            }, 100);
        });
    } else {
        spotlightWrapper.css("margin-top", "25px");
        spotlightRenderer.css("justify-content", "flex-start").addClass("wrap");
    }

    // サムネイルの読み込みを待つ関数
    const waitForThumbnail = ($item) => {
        return new Promise(resolve => {
            const checkThumbnail = async () => {
                const img = $item.find('yt-image img.yt-core-image');
                const isLoaded = img.length > 0 && img.attr('src');

                if (isLoaded) {
                    resolve(true);
                } else {
                    console.log("checkThumbnail"); // デバッグ用 消すな
                    setTimeout(checkThumbnail, 100);
                }
            };
            checkThumbnail();
        });
    };

    // スクロール処理
    const scrollToBottomAndBack = async () => {
        const originalScroll = window.scrollY;
        const viewportHeight = window.innerHeight;
        const targetScroll = viewportHeight * 3; // 3ページ分

        // 1ページずつ高速スクロール（戻らない）
        for (let currentScroll = viewportHeight; currentScroll <= targetScroll; currentScroll += viewportHeight) {
            window.scrollTo({
                top: currentScroll,
                behavior: 'instant' // 瞬時にスクロール
            });
            await new Promise(resolve => setTimeout(resolve, 1)); // 最小限の待機時間
        }
        
        // スクロール完了後、最後に元の位置に戻る
        await new Promise(resolve => setTimeout(resolve, 50));
        window.scrollTo({
            top: originalScroll,
            behavior: 'instant'
        });
    };

    // 動画のコピーを実行
    const processVideos = async () => {
        // ページ読み込み完了時にスクロールを実行
        await scrollToBottomAndBack();

        const items = $("ytd-rich-item-renderer.ytd-rich-grid-renderer");
        console.log("Found items:", items.length);

        for (const item of items) {
            const $item = $(item);
            const channelLink = $item.find(".yt-simple-endpoint.style-scope.yt-formatted-string").attr("href");
            if (channelLink) {
                const channelId = channelLink.split("/").slice(-1)[0];
                const exists = await isExists(channelId);
                if (exists) {
                    console.log("Processing item for channel:", channelId);
                    await waitForThumbnail($item);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const $clonedItem = $item.clone(true);
                    
                    if (live && !$item.find("ytd-badge-supported-renderer").attr("hidden")) {
                        $clonedItem.appendTo(spotlightRenderer);
                        updateHeight();
                    }
                    if (arch && $item.find("ytd-badge-supported-renderer").attr("hidden") && 
                        !$item.find("ytd-toggle-button-renderer").length) {
                        $clonedItem.appendTo(spotlightRenderer);
                        updateHeight();
                    }
                    if (sche && $item.find("ytd-toggle-button-renderer").length) {
                        $clonedItem.appendTo(spotlightRenderer);
                        updateHeight();
                    }
                }
            }
        }
    };

    // 動画の処理を開始
    await processVideos();

    // リサイズイベントのデバウンス処理
    let resizeTimeout;
    $(window).off('resize').on('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateHeight();
            
            if (style === "overflow") {
                const left = spotlightWrapper.scrollLeft();
                const scrollWidth = spotlightWrapper[0].scrollWidth;
                const offsetWidth = spotlightWrapper[0].offsetWidth;
                
                if(left > 0){
                    $("#spotlightLeftBtn").fadeIn();
                } else {
                    $("#spotlightLeftBtn").fadeOut();
                }

                if(left < scrollWidth - offsetWidth - 1){
                    $("#spotlightRightBtn").fadeIn();
                } else {
                    $("#spotlightRightBtn").fadeOut();
                }
            }
        }, 250);
    });

    // 要素の読み込みを監視して高さを更新
    const observer = new MutationObserver(() => {
        updateHeight();
    });

    observer.observe(spotlightRenderer[0], {
        childList: true,
        subtree: true,
        attributes: true
    });
}

setFave = "<div id='setFave' hidden><img style='padding-top: 2px;' src=" + chrome.runtime.getURL("imgs/addFave.png") + " width='35px' height='35px'></div>";
removeFave = "<div id='removeFave' hidden><img style='padding-top: 2px;' src=" + chrome.runtime.getURL("imgs/remFave.png") + " width='35px' height='35px'></div>";

async function initialize(){
    if(initFlag) return;

    if(location.href.endsWith("subscriptions")){
        await findMyFave();
        initFlag = true;
    }
    else{
        urls = location.href.split("/");
        // チャンネルIDをカスタムしてる場合は   youtube.com/c/[channelID]
        // カスタムしていなければ               youtube.com/channel/[channelID]
        // ハンドル設定済みだと                 youtube.com/@[channelID]
        if(urls[3].indexOf("@") != -1){
            let cid = urls[3];
            $("yt-flexible-actions-view-model").append(removeFave);
            $("yt-flexible-actions-view-model").append(setFave);
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
            const exists = await isExists(cid);
            if(exists){
                $("#removeFave").removeAttr("hidden");
            }
            else{
                $("#setFave").removeAttr("hidden");
            }
        }
        else if(urls[3].indexOf("c") != -1){
            let cid = urls[4];
            $("yt-flexible-actions-view-model").append(removeFave);
            $("yt-flexible-actions-view-model").append(setFave);
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
            const exists = await isExists(cid);
            if(exists){
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
        
        initialize().catch(console.error);
        
        // youtubeは他のページに移動する際に検索バーやサイドバーは再読み込みしない 
        // ページ移動検出用 pageNavigation要素がhiddenになったら遷移完了
        var pageNavigation = document.getElementsByTagName("yt-page-navigation-progress")[0];
        let observer1 = new MutationObserver(function(){
            if(pageNavigation.getAttribute("hidden") == ""){
                initialize().catch(console.error);
            }
        });
        const config1 = {attributes: true};
        observer1.observe(pageNavigation, config1);
    }
}
