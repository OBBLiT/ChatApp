let x = document.getElementById('input-text');
document.getElementById('s-button').addEventListener('click', (e)=>{
    
    if (x.value.trim().length === 0) {
        e.preventDefault();
    }
});