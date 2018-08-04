/**
 * Some banner code here just for demo
 */

const {container, data}= module,
    timeEl= container.querySelector('.time'),
    propsEl= container.querySelector('.props'),
    {audio, sandbox}= data;

propsEl.innerHTML = `
    Your browser ${audio ? 'supports' : 'does not support '} HTML5 audio<br/>
    Is sandbox environment: ${sandbox===null? 'probably cross-origin implicit sandbox' : sandbox}
`;

function update(){
    timeEl.innerHTML= new Date().toLocaleTimeString();
}

setInterval(update, 1000);

update();

container.onclick= ()=>{
    alert(`banner container ${container.id}`);
};


/*
 here we can set up waiting for the full load & initialization
 of the banner, before showing it in the container.
 */

export default new Promise((resolve, reject)=>{
   setTimeout(resolve, 0);
});