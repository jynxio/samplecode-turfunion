import "/style/reset.css";

import * as three from "three";

import earcut from "earcut";

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
/* Main */
main();

async function main() {

    /* 获取数据 */
    const geojson_object_array = await fetchData();

    /* 融合 */
    const geojson_object_union = union( geojson_object_array );

    /* 绘制融合图形 */
    const earcut_parameter_union = convertToEarcutParameter( geojson_object_union );

    const { vertex, hole, dimension } = earcut_parameter_union;
    const color = 0x333333;
    const wireframe = false;

    const mesh = createPolygon( vertex, hole, dimension, color, wireframe );

    scene.add( mesh );

    /* 绘制解构图形 */
    const earcut_parameter_array =  geojson_object_array.map( geojson_object => {

        const earcut_parameter = convertToEarcutParameter( geojson_object );

        return earcut_parameter;

    } );

    earcut_parameter_array.forEach( earcut_parameter => {

        const { vertex, hole, dimension } = earcut_parameter;
        const color = Math.round( Math.random() * 0xffffff );
        const wireframe = true;

        const mesh = createPolygon( vertex, hole, dimension, color, wireframe );

        scene.add( mesh );

    } );

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
function convertToEarcutParameter( input ) {

    const coordinates = input.geometry.coordinates;

    const hole = [];
    const vertex = [];
    const dimension = 3;

    for ( let i = 0; i < coordinates.length; i++ ) {

        const linear_ring = coordinates[ i ];

        for ( let j = 0; j < linear_ring.length; j++ ) {

            const [ x, y ] = linear_ring[ j ];

            vertex.push( x, y, 0 );

        }

        if ( !i ) continue; // 当coordinates拥有的linear ring的数量大于1时，执行下述代码来创建hole。

        hole.push(
            hole.length === 0
            ? coordinates[ i - 1 ].length
            : (coordinates[ i - 1 ].length + hole[ hole.length - 1 ] )
        );

    }

    const output = {
        hole: hole.length === 0 ? null : hole,
        vertex,
        dimension,
    };

    return output;

}


/* ------------------------------------------------------------------------------------------------------ */
/**
 * 创建Mesh实例。
 * @param {*} vertex
 * @param {*} hole
 * @param {*} dimension
 * @param {*} color
 * @param {*} wireframe
 * @returns - Mesh实例。
 */
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
/**
 * 融合图形。
 * @param  {Array} input - 一个数组，它拥有至少2个GeoJSON Object（必须是Polygon类型）。
 * @returns {Object} - GeoJSON Object。
 */
function union( input ) {

    if ( input.length < 2 ) {

        console.error("传入的GeoJSOn Object的数量小于2。");

        return;

    }

    let output = input[ 0 ];

    let index = 1;

    while ( index < input.length ) {

        output = turfunion( output, input[ index ] );

        index++;

    }

    return output;

}
