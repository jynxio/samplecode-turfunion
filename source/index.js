import "/style/reset.css";

import * as three from "three";

import earcut from "earcut";

import * as greinerhormann from "greiner-hormann";

import * as turf from "@turf/turf";

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
const positions = [ // 非linear ring
    [ - 50, 50, - 50, 40, 50, 40, 50, 50 ],
    [ 50, 50, 40, 50, 40, - 50, 50, - 50 ],
    [ 50, - 50, 50, - 40, - 50, - 40, - 50, - 50 ],
    [ - 50, - 50, - 40, - 50, - 40, 50, - 50, 50 ],
    [ - 5, 50, - 5, - 50, 5, - 50, 5, 50 ],
];

const polygon_1 = createPolygon( position_1, 0xff0000, true );
const polygon_2 = createPolygon( position_2, 0x00ff00, true );
const polygon_3 = createPolygon( position_3, 0x0000ff, true );
const polygon_4 = createPolygon( position_4, 0xffff00, true );
const polygon_5 = createPolygon( position_5, 0xff00ff, true );

function createPolygon( data, color, wireframe ) {

    /*  */
    const geometry = new three.BufferGeometry();
    const material = new three.MeshBasicMaterial( { color, wireframe } );
    const mesh = new three.Mesh( geometry, material );

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

/**
 *
 * @param  {Array} input - 比如[ p_1, p_2, ... ]，其中p_1是[ x, y, x, y, ... ]
 */
function union( ...input ) {

    const turfpolygons = input.map( item => {

        const coordinate = [];

        for ( let i = 0; i < item.length; i += 2 ) {

            const x = item[ i + 0 ];
            const y = item[ i + 1 ];
            const pair = [ x, y ];

            coordinate.push( pair );

        }

        const turfpolygon = {
            geometry: {
                type: "Polygon",
                coordinates: [ coordinate ],
            },
            properties: {},
            type: "Feature"
        };

        return turfpolygon;

    } );

    let turfunion = turfpolygons[ 0 ];

    for ( let i = 1; i < turfpolygons.length; i++ ) {

        turfunion = turf.union( turfunion, turfpolygons[ i ] );

    }

    return turfunion;

}
