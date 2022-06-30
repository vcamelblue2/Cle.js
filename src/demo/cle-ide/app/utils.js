export const onclick = 'ontouchstart' in window ? 'ontouchstart' : 'onclick'

export const range = (start, end, increment=1)=>{
    let res = []
    for (let i=start; i<end; i+=increment){
        res.push(i) 
    }
    return res
}
  