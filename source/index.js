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
/* Main */
main();

async function main() {

    const data = await fetchData();

    console.log( data );

}

/* ------------------------------------------------------------------------------------------------------ */
/**
 * 获取并返回data.json的数据。
 * @returns {Array} - 一个存储多个GeoJSON Object的数组，turf/polygon方法的返回值也是一个GeoJSON Object。
 */
async function fetchData() {

    let data;

    data = await fetch("/static/data.json");
    data = await data.json();
    data = data.features;

    return data;

}

/* ------------------------------------------------------------------------------------------------------ */
/**
 * 将GeoJSON Object转换成earcut的3个参数，分别是vertex、hole、dimension。注意，该程序将经度转换为x，纬度转换为y，并自动填补
 * 值为0的z，因此输出结果中的dimension是3。
 * @param {Array} input - GeoJSON Object数据。
 * @returns {Object} - 一个拥有3个属性的对象，分别是vertex、hole、dimension。
 */
function convertToFlatArray( input ) {

    const coordinates = input.geometry.coordinates;

    const hole = [];
    const vertex = [];

    for ( let i = 0; i < coordinates.length; i++ ) {

        const linear_ring = coordinates[ i ];

        for ( let j = 0; j < linear_ring.length; j++ ) {

            const [ x, y ] = linear_ring[ j ];

            vertex.push( x, y, 0 );

        }

    }

}


/* ------------------------------------------------------------------------------------------------------ */
/* 绘制矩形 */
// positions.forEach( position => {

//     return;

//     const color = Math.round( Math.random() * 0xffffff );

//     const mesh = createPolygon( position, undefined, 3, color, true );

//     scene.add( mesh );

// } );

function createPolygon( vertex, hole, dimension, color, wireframe ) {

    /*  */
    const geometry = new three.BufferGeometry();
    const material = new three.MeshBasicMaterial( { color, wireframe } );
    const mesh = new three.Mesh( geometry, material );

    /*  */
    let position;

    position = new Float32Array( vertex );
    position = new three.BufferAttribute( position, 3 );

    geometry.setAttribute( "position", position );

    /*  */
    let index;

    index = earcut( vertex, hole, dimension );
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

/* ------------------------------------------------------------------------------------------------------ */
/* 融合矩形 */

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
