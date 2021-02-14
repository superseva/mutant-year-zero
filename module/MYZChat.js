export function addChatLogListeners(app,html,data){
    html.on('click', '.pushaction', onPush);
}

function onPush(event){
    const _eltchatmessage = event.currentTarget.closest(".chat-message");
    const _roll_name = event.currentTarget.closest(".pushaction").dataset.name;
    let _chatmessage = game.messages.get(_eltchatmessage.dataset.messageId); // Get ChatMessage instance
    
    /* DiceRoller Hack*/ 
    CONFIG.roller.resetDices();
    CONFIG.roller.lastRollName = _roll_name;
    CONFIG.roller.parseResults(_chatmessage.roll);
    /*Pushing*/
    CONFIG.roller.push()
}

export function addChatMessageListeners(app,html,data){
    _hideChatActionButton(app,html,data);
}

function _hideChatActionButton (app, html, data){
    const _elt_with_user_id = html.find(".myz.chat-item");
    if(_elt_with_user_id.length > 0){
        let user = _elt_with_user_id[0].dataset.userId
        if((!(game.user.id === user))){
            const buttons = _elt_with_user_id.find(".hidefromnotowner");
            buttons.each((i, btn) => {
                btn.style.display = "none"
            });
        }
    }
}