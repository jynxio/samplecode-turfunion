import "/style/reset.css";

import * as three from "three";

import earcut from "earcut";

import * as greinerhormann from "greiner-hormann";

import turfunion from "@turf/union";

/* ------------------------------------------------------------------------------------------------------ */
/* CSS */
document.body.style.backgroundColor = "#000";

/* ------------------------------------------------------------------------------------------------------ */
/* Renderer */
const renderer = new three.WebGLRenderer( { antialias: window.devicePixelRatio < 2 } );

renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.append( renderer.domElement );

/* Scene */
const scene = new three.Scene();

/* Camera */
const aspect_ratio = window.innerWidth / window.innerHeight;
const camera = new three.OrthographicCamera(
    - 100 * aspect_ratio, // left
    + 100 * aspect_ratio, // right
    + 100,                // top
    - 100,                // bottom
    0.1,                  // near
    100,                  // far
);

camera.position.set( 0, 0, 1 );

scene.add( camera );

/* Resize */
window.addEventListener( "resize", _ => {

    renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
    renderer.setSize( window.innerWidth, window.innerHeight);

    const aspect_ratio = window.innerWidth / window.innerHeight;

    camera.left = - 100 * aspect_ratio;
    camera.right = + 100 * aspect_ratio;
    camera.updateProjectionMatrix();

} );

/* Render */
renderer.setAnimationLoop( function loop() {

    renderer.render( scene, camera );

} );

/* ------------------------------------------------------------------------------------------------------ */
const position_1 = [ [ - 50, 50 ], [ - 50, 40 ], [ 50, 40 ], [ 50, 50 ] ];
const position_2 = [ [ 50, 50 ], [ 40, 50 ], [ 40, - 50 ], [ 50, - 50 ] ];
const position_3 = [ [ 50, - 50 ], [ 50, - 40 ], [ - 50, - 40 ], [ - 50, - 50 ] ];
const position_4 = [ [ - 50, - 50 ], [ - 40, - 50 ], [ - 40, 50 ], [ - 50, 50 ] ];
const position_5 = [ [ - 5, 50 ], [ - 5, - 50 ], [ 5, - 50 ], [ 5, 50 ] ];

const polygon_1 = createPolygon( position_1, 0xff0000, true );
const polygon_2 = createPolygon( position_2, 0x00ff00, true );
const polygon_3 = createPolygon( position_3, 0x0000ff, true );
const polygon_4 = createPolygon( position_4, 0xffff00, true );
const polygon_5 = createPolygon( position_5, 0xff00ff, true );

scene.add(
    polygon_1,
    polygon_2,
    polygon_3,
    polygon_4,
    polygon_5,
);

function createPolygon( data, color, wireframe ) {

    /*  */
    const geometry = new three.BufferGeometry();
    const material = new three.MeshBasicMaterial( { color, wireframe } );
    const mesh = new three.Mesh( geometry, material );

    /*  */
    const flat_array = [];

    data.forEach( item => flat_array.push( ...item, 0 ) );

    /*  */
    let position;

    position = new Float32Array( flat_array );
    position = new three.BufferAttribute( position, 3 );

    geometry.setAttribute( "position", position );

    /*  */
    let index;

    index = earcut( flat_array, null, 3 );
    index = new Uint16Array( index );
    index = new three.BufferAttribute( index, 1 );

    geometry.setIndex( index );
    geometry.index.needsUpdate = true;

    /*  */
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    /*  */
    return mesh;

}
