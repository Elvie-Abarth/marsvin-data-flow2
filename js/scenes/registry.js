// Scene registry. Every file in js/scenes/ calls defineScenes([...]) to add its scenes;
// the order they play in is set in js/scenes/order.js.
const SCENE_DEFS = {};
function defineScenes(list) { list.forEach(s => { SCENE_DEFS[s.name] = s; }); }
