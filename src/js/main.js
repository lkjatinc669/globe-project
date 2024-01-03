function basicGlobe(){
    const N = 300;
    const gData = [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      size: Math.random() / 3,
      color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
    }));

    Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .pointsData(gData)
      .pointAltitude('size')
      .pointColor('color')
    (document.getElementById('visualize'))
}

function choropleth(){
    const colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd);

    // GDP per capita (avoiding countries with small pop)
    const getVal = feat => feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

    fetch('https://raw.githubusercontent.com/vasturiano/aframe-globe-component/master/examples/datasets/ne_110m_admin_0_countries.geojson').then(res => res.json()).then(countries =>
    {
      const maxVal = Math.max(...countries.features.map(getVal));
      colorScale.domain([0, maxVal]);

      const world = Globe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .lineHoverPrecision(0)
        .polygonsData(countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'))
        .polygonAltitude(0.06)
        .polygonCapColor(feat => colorScale(getVal(feat)))
        .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
        .polygonStrokeColor(() => '#111')
        .polygonLabel(({ properties: d }) => `
          <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
          GDP: <i>${d.GDP_MD_EST}</i> M$<br/>
          Population: <i>${d.POP_EST}</i>
        `)
        .onPolygonHover(hoverD => world
          .polygonAltitude(d => d === hoverD ? 0.12 : 0.06)
          .polygonCapColor(d => d === hoverD ? 'steelblue' : colorScale(getVal(d)))
        )
        .polygonsTransitionDuration(300)
      (document.getElementById('visualize'))
    });
}

function clouds(){
    const world = Globe({ animateIn: false })
      (document.getElementById('visualize'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');

    // Auto-rotate
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.35;

    // Add clouds sphere
    const CLOUDS_IMG_URL = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/clouds/clouds.png'; // from https://github.com/turban/webgl-earth
    const CLOUDS_ALT = 0.004;
    const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame

    new THREE.TextureLoader().load(CLOUDS_IMG_URL, cloudsTexture => {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(world.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
        new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true })
      );
      world.scene().add(clouds);

      (function rotateClouds() {
        clouds.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
        requestAnimationFrame(rotateClouds);
      })();
    });
}

function countryPopulation() {
    const world = Globe()
      (document.getElementById('visualize'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .pointOfView({ altitude: 4 }, 5000)
      .polygonCapColor(feat => 'rgba(200, 0, 0, 0.6)')
      .polygonSideColor(() => 'rgba(0, 100, 0, 0.05)')
      .polygonLabel(({ properties: d }) => `
          <b>${d.ADMIN} (${d.ISO_A2})</b> <br />
          Population: <i>${Math.round(+d.POP_EST / 1e4) / 1e2}M</i>
        `);

    // Auto-rotate
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 1.8;

    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson').then(res => res.json()).then(countries => {
      world.polygonsData(countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'));

      setTimeout(() => world
        .polygonsTransitionDuration(4000)
        .polygonAltitude(feat => Math.max(0.1, Math.sqrt(+feat.properties.POP_EST) * 7e-5))
      , 3000);
    });
}

function custom(){
    const world = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      (document.getElementById('visualize'));

    // custom globe material
    const globeMaterial = world.globeMaterial();
    globeMaterial.bumpScale = 10;
    new THREE.TextureLoader().load('//unpkg.com/three-globe/example/img/earth-water.png', texture => {
      globeMaterial.specularMap = texture;
      globeMaterial.specular = new THREE.Color('grey');
      globeMaterial.shininess = 15;
    });

    const directionalLight = world.lights().find(light => light.type === 'DirectionalLight');
    directionalLight && directionalLight.position.set(1, 1, 1); // change light position to see the specularMap's effect
}


function customlayer(){
    const N = 300;
    const gData = [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      alt: Math.random() * 0.8 + 0.1,
      radius: Math.random() * 5,
      color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
    }));

    const world = Globe()
      (document.getElementById('visualize'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .pointOfView({ altitude: 3.5 })
      .customLayerData(gData)
      .customThreeObject(d => new THREE.Mesh(
        new THREE.SphereGeometry(d.radius),
        new THREE.MeshLambertMaterial({ color: d.color })
      ))
      .customThreeObjectUpdate((obj, d) => {
        Object.assign(obj.position, world.getCoords(d.lat, d.lng, d.alt));
      });

    (function moveSpheres() {
      gData.forEach(d => d.lat += 0.2);
      world.customLayerData(world.customLayerData());
      requestAnimationFrame(moveSpheres);
    })();
}

function earthShield(){
    const shieldRing = { lat: 90, lng: 0 };

    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .ringsData([shieldRing])
      .ringAltitude(0.25)
      .ringColor(() => 'lightblue')
      .ringMaxRadius(180)
      .ringPropagationSpeed(20)
      .ringRepeatPeriod(200)
      (document.getElementById('visualize'));
}

function earthquakes(){
    const weightColor = d3.scaleLinear()
      .domain([0, 60])
      .range(['lightblue', 'darkred'])
      .clamp(true);

    const myGlobe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .hexBinPointLat(d => d.geometry.coordinates[1])
      .hexBinPointLng(d => d.geometry.coordinates[0])
      .hexBinPointWeight(d => d.properties.mag)
      .hexAltitude(({ sumWeight }) => sumWeight * 0.0025)
      .hexTopColor(d => weightColor(d.sumWeight))
      .hexSideColor(d => weightColor(d.sumWeight))
      .hexLabel(d => `
        <b>${d.points.length}</b> earthquakes in the past month:<ul><li>
          ${d.points.slice().sort((a, b) => b.properties.mag - a.properties.mag).map(d => d.properties.title).join('</li><li>')}
        </li></ul>
      `)
      (document.getElementById('visualize'));

    fetch('//earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson').then(res => res.json()).then(equakes => {
      myGlobe.hexBinPointsData(equakes.features);
    });
}

function emitArcs(){
    const ARC_REL_LEN = 0.4; // relative to whole arc
    const FLIGHT_TIME = 1000;
    const NUM_RINGS = 3;
    const RINGS_MAX_R = 5; // deg
    const RING_PROPAGATION_SPEED = 5; // deg/sec

    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .arcColor(() => 'darkOrange')
      .onGlobeClick(emitArc)
      .arcDashLength(ARC_REL_LEN)
      .arcDashGap(2)
      .arcDashInitialGap(1)
      .arcDashAnimateTime(FLIGHT_TIME)
      .arcsTransitionDuration(0)
      .ringColor(() => t => `rgba(255,100,50,${1-t})`)
      .ringMaxRadius(RINGS_MAX_R)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod(FLIGHT_TIME * ARC_REL_LEN / NUM_RINGS)
      (document.getElementById('visualize'));

    let prevCoords = { lat: 0, lng: 0 };
    function emitArc({ lat: endLat, lng: endLng }) {
      const { lat: startLat, lng: startLng } = prevCoords;
      setTimeout(() => { prevCoords = { lat: endLat, lng: endLng }}, FLIGHT_TIME);

      // add and remove arc after 1 cycle
      const arc = { startLat, startLng, endLat, endLng };
      globe.arcsData([...globe.arcsData(), arc]);
      setTimeout(() => globe.arcsData(globe.arcsData().filter(d => d !== arc)), FLIGHT_TIME * 2);

      // add and remove start rings
      const srcRing = { lat: startLat, lng: startLng };
      globe.ringsData([...globe.ringsData(), srcRing]);
      setTimeout(() => globe.ringsData(globe.ringsData().filter(r => r !== srcRing)), FLIGHT_TIME * ARC_REL_LEN);

      // add and remove target rings
      setTimeout(() => {
        const targetRing = { lat: endLat, lng: endLng };
        globe.ringsData([...globe.ringsData(), targetRing]);
        setTimeout(() => globe.ringsData(globe.ringsData().filter(r => r !== targetRing)), FLIGHT_TIME * ARC_REL_LEN);
      }, FLIGHT_TIME);
    }
}

function heatmaps(){
    const N = 300;
    const gData = [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 160,
      lng: (Math.random() - 0.5) * 360,
      weight: Math.random()
    }));

    const world = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .heatmapsData([gData])
      .heatmapPointLat('lat')
      .heatmapPointLng('lng')
      .heatmapPointWeight('weight')
      .heatmapTopAltitude(0.7)
      .heatmapsTransitionDuration(3000)
      .enablePointerInteraction(false)
      (document.getElementById('visualize'));
}

function hexedPolygons(){
    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson').then(res => res.json()).then(countries =>
        {
          const world = Globe()
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
            .hexPolygonsData(countries.features)
            .hexPolygonResolution(3)
            .hexPolygonMargin(0.3)
            .hexPolygonUseDots(true)
            .hexPolygonColor(() => `#${Math.round(Math.random() * Math.pow(2, 24)).toString(16).padStart(6, '0')}`)
            .hexPolygonLabel(({ properties: d }) => `
              <b>${d.ADMIN} (${d.ISO_A2})</b> <br />
              Population: <i>${d.POP_EST}</i>
            `)
            (document.getElementById('visualize'))
        });
}

function hollowGlobe(){
    const world = Globe()
      (document.getElementById('visualize'))
      .backgroundColor('rgba(0,0,0,0)')
      .showGlobe(false)
      .showAtmosphere(false);

    fetch('//unpkg.com/world-atlas/land-110m.json').then(res => res.json())
      .then(landTopo => {
        world
          .polygonsData(topojson.feature(landTopo, landTopo.objects.land).features)
          .polygonCapMaterial(new THREE.MeshLambertMaterial({ color: 'darkslategrey', side: THREE.DoubleSide }))
          .polygonSideColor(() => 'rgba(0,0,0,0)');
      });
}

function htmlMarkers(){
    const markerSvg = `<svg viewBox="-4 0 36 36">
    <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
    <circle fill="black" cx="14" cy="14" r="7"></circle>
  </svg>`;

  // Gen random data
  const N = 30;
  const gData = [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: 7 + Math.random() * 30,
    color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
  }));

  Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .htmlElementsData(gData)
    .htmlElement(d => {
      const el = document.createElement('div');
      el.innerHTML = markerSvg;
      el.style.color = d.color;
      el.style.width = `${d.size}px`;

      el.style['pointer-events'] = 'auto';
      el.style.cursor = 'pointer';
      el.onclick = () => console.info(d);
      return el;
    })
    (document.getElementById('visualize'));
}

function moonLandingSites(){
    const colorScale = d3.scaleOrdinal(['orangered', 'mediumblue', 'darkgreen', 'yellow']);

  const labelsTopOrientation = new Set(['Apollo 12', 'Luna 2', 'Luna 20', 'Luna 21', 'Luna 24', 'LCROSS Probe']); // avoid label collisions

  const elem = document.getElementById('visualize');
  const moon = Globe()
    .globeImageUrl('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/moon-landing-sites/lunar_surface.jpg')
    .bumpImageUrl('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/moon-landing-sites/lunar_bumpmap.jpg')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .showGraticules(true)
    .showAtmosphere(false) // moon has no atmosphere
    .labelText('label')
    .labelSize(1.7)
    .labelDotRadius(0.4)
    .labelDotOrientation(d => labelsTopOrientation.has(d.label) ? 'top' : 'bottom')
    .labelColor(d => colorScale(d.agency))
    .labelLabel(d => `
        <div><b>${d.label}</b></div>
        <div>${d.agency} - ${d.program} Program</div>
        <div>Landing on <i>${new Date(d.date).toLocaleDateString()}</i></div>
      `)
    .onLabelClick(d => window.open(d.url, '_blank'))
    (elem);

  fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/moon-landing-sites/moon_landings.json').then(r => r.json()).then(landingSites => {
    moon.labelsData(landingSites);
  });
}

function populationHeatmap() {
    const world = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .heatmapPointLat('lat')
      .heatmapPointLng('lng')
      .heatmapPointWeight('pop')
      .heatmapBandwidth(0.9)
      .heatmapColorSaturation(2.8)
      .enablePointerInteraction(false)
      (document.getElementById('visualize'));

    fetch('../datasets/world_population.csv').then(res => res.text())
      .then(csv => d3.csvParse(csv, ({ lat, lng, pop }) => ({ lat: +lat, lng: +lng, pop: +pop })))
      .then(data => world.heatmapsData([data]));
}

function randomArcs() {
    const N = 20;
    const arcsData = [...Array(N).keys()].map(() => ({
      startLat: (Math.random() - 0.5) * 180,
      startLng: (Math.random() - 0.5) * 360,
      endLat: (Math.random() - 0.5) * 180,
      endLng: (Math.random() - 0.5) * 360,
      color: [['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)], ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]]
    }));

    Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .arcsData(arcsData)
      .arcColor('color')
      .arcDashLength(() => Math.random())
      .arcDashGap(() => Math.random())
      .arcDashAnimateTime(() => Math.random() * 4000 + 500)
    (document.getElementById('visualize'))
}

function randomPaths() {
    const N = 20;
    const arcsData = [...Array(N).keys()].map(() => ({
      startLat: (Math.random() - 0.5) * 180,
      startLng: (Math.random() - 0.5) * 360,
      endLat: (Math.random() - 0.5) * 180,
      endLng: (Math.random() - 0.5) * 360,
      color: [['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)], ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]]
    }));

    Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .arcsData(arcsData)
      .arcColor('color')
      .arcDashLength(() => Math.random())
      .arcDashGap(() => Math.random())
      .arcDashAnimateTime(() => Math.random() * 4000 + 500)
    (document.getElementById('visualize'))
}

function randomRings() {
    const N = 10;
    const gData = [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      maxR: Math.random() * 20 + 3,
      propagationSpeed: (Math.random() - 0.5) * 20 + 1,
      repeatPeriod: Math.random() * 2000 + 200
    }));

    const colorInterpolator = t => `rgba(255,100,50,${Math.sqrt(1-t)})`;

    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .ringsData(gData)
      .ringColor(() => colorInterpolator)
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod('repeatPeriod')
      (document.getElementById('visualize'));
}

function satellites() {
    const EARTH_RADIUS_KM = 6371; // km
    const SAT_SIZE = 100; // km
    const TIME_STEP = 3 * 1000; // per frame

    const timeLogger = document.getElementById('time');

    const world = Globe()
      (document.getElementById('chart'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .objectLat('lat')
      .objectLng('lng')
      .objectAltitude('alt')
      .objectFacesSurface(false)
      .objectLabel('name');

    setTimeout(() => world.pointOfView({ altitude: 3.5 }));

    const satGeometry = new THREE.OctahedronGeometry(SAT_SIZE * world.getGlobeRadius() / EARTH_RADIUS_KM / 2, 0);
    const satMaterial = new THREE.MeshLambertMaterial({ color: 'palegreen', transparent: true, opacity: 0.7 });
    world.objectThreeObject(() => new THREE.Mesh(satGeometry, satMaterial));

    fetch('../datasets/space-track-leo.txt').then(r => r.text()).then(rawData => {
      const tleData = rawData.replace(/\r/g, '')
        .split(/\n(?=[^12])/)
        .filter(d => d)
        .map(tle => tle.split('\n'));
      const satData = tleData.map(([name, ...tle]) => ({
        satrec: satellite.twoline2satrec(...tle),
        name: name.trim().replace(/^0 /, '')
      }))
      // exclude those that can't be propagated
      .filter(d => !!satellite.propagate(d.satrec, new Date()).position)
      .slice(0, 2000);

      // time ticker
      let time = new Date();
      (function frameTicker() {
        requestAnimationFrame(frameTicker);

        time = new Date(+time + TIME_STEP);
        timeLogger.innerText = time.toString();

        // Update satellite positions
        const gmst = satellite.gstime(time);
        satData.forEach(d => {
          const eci = satellite.propagate(d.satrec, time);
          if (eci.position) {
            const gdPos = satellite.eciToGeodetic(eci.position, gmst);
            d.lat = satellite.radiansToDegrees(gdPos.latitude);
            d.lng = satellite.radiansToDegrees(gdPos.longitude);
            d.alt = gdPos.height / EARTH_RADIUS_KM
          }
        });

        world.objectsData(satData);
      })();
    });
}

function solarTerminator() {
    const VELOCITY = 9; // minutes per frame

    const sunPosAt = dt => {
      const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
      const t = solar.century(dt);
      const longitude = (day - dt) / 864e5 * 360 - 180;
      return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
    };

    let dt = +new Date();
    const solarTile = { pos: sunPosAt(dt) };
    const timeEl = document.getElementById('time');

    const world = Globe()
      (document.getElementById('visualize'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .tilesData([solarTile])
      .tileLng(d => d.pos[0])
      .tileLat(d => d.pos[1])
      .tileAltitude(0.005)
      .tileWidth(180)
      .tileHeight(180)
      .tileUseGlobeProjection(false)
      .tileMaterial(() => new THREE.MeshLambertMaterial({ color: '#ffff00', opacity: 0.3, transparent: true }))
      .tilesTransitionDuration(0);

    // animate time of day
    requestAnimationFrame(() =>
      (function animate() {
        dt += VELOCITY * 60 * 1000;
        solarTile.pos = sunPosAt(dt);
        world.tilesData([solarTile]);
        timeEl.textContent = new Date(dt).toLocaleString();
        requestAnimationFrame(animate);
      })()
    );
}

function submarineCables() {
    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      (document.getElementById('visualize'));

    // from https://www.submarinecablemap.com
    fetch('//http-proxy.vastur.com?url=https://www.submarinecablemap.com/api/v3/cable/cable-geo.json')
      .then(r => r.json())
      .then(cablesGeo => {
        let cablePaths = [];
        cablesGeo.features.forEach(({ geometry, properties }) => {
          geometry.coordinates.forEach(coords => cablePaths.push({ coords, properties }));
        });

        globe
          .pathsData(cablePaths)
          .pathPoints('coords')
          .pathPointLat(p => p[1])
          .pathPointLng(p => p[0])
          .pathColor(path => path.properties.color)
          .pathLabel(path => path.properties.name)
          .pathDashLength(0.1)
          .pathDashGap(0.008)
          .pathDashAnimateTime(12000);
      });
}

function tiles(){
    const TILE_MARGIN = 0.35; // degrees

  // Gen random data
  const GRID_SIZE = [60, 20];
  const COLORS = ['red', 'green', 'yellow', 'blue', 'orange', 'pink', 'brown', 'purple', 'magenta'];

  const materials = COLORS.map(color => new THREE.MeshLambertMaterial({ color, opacity: 0.6, transparent: true }));
  const tileWidth = 360 / GRID_SIZE[0];
  const tileHeight = 180 / GRID_SIZE[1];
  const tilesData = [];
  [...Array(GRID_SIZE[0]).keys()].forEach(lngIdx =>
    [...Array(GRID_SIZE[1]).keys()].forEach(latIdx =>
      tilesData.push({
        lng: -180 + lngIdx * tileWidth,
        lat: -90 + (latIdx + 0.5) * tileHeight,
        material: materials[Math.floor(Math.random() * materials.length)]
      })
    )
  );

  Globe()
    .tilesData(tilesData)
    .tileWidth(tileWidth - TILE_MARGIN)
    .tileHeight(tileHeight - TILE_MARGIN)
    .tileMaterial('material')
    (document.getElementById('visualize'))
}

function worldVolcanoHeatmap(){
    const world = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .heatmapPointLat('lat')
      .heatmapPointLng('lon')
      .heatmapPointWeight(d => d.elevation * 5e-5)
      .heatmapTopAltitude(0.2)
      .heatmapBandwidth(1.35)
      .heatmapColorSaturation(3.2)
      .enablePointerInteraction(false)
      (document.getElementById('visualize'));

    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/world_volcanoes.json').then(res => res.json()).then(volcanoes => {
      world.heatmapsData([volcanoes])
    });
}

function volcanoes() {
    const world = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .heatmapPointLat('lat')
      .heatmapPointLng('lon')
      .heatmapPointWeight(d => d.elevation * 5e-5)
      .heatmapTopAltitude(0.2)
      .heatmapBandwidth(1.35)
      .heatmapColorSaturation(3.2)
      .enablePointerInteraction(false)
      (document.getElementById('visualize'));

    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/world_volcanoes.json').then(res => res.json()).then(volcanoes => {
      world.heatmapsData([volcanoes])
    });
}

function worldCities() {
    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_populated_places_simple.geojson')
    .then(res => res.json()).then(places => {
        Globe()
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
          .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
          .labelsData(places.features)
          .labelLat(d => d.properties.latitude)
          .labelLng(d => d.properties.longitude)
          .labelText(d => d.properties.name)
          .labelSize(d => Math.sqrt(d.properties.pop_max) * 4e-4)
          .labelDotRadius(d => Math.sqrt(d.properties.pop_max) * 4e-4)
          .labelColor(() => 'rgba(255, 165, 0, 0.75)')
          .labelResolution(2)
        (document.getElementById('visualize'))
      });
}

function worldPopulation() {
    const weightColor = d3.scaleSequentialSqrt(d3.interpolateYlOrRd)
      .domain([0, 1e7]);

    const world = Globe()
      (document.getElementById('visualize'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .hexBinPointWeight('pop')
      .hexAltitude(d => d.sumWeight * 6e-8)
      .hexBinResolution(4)
      .hexTopColor(d => weightColor(d.sumWeight))
      .hexSideColor(d => weightColor(d.sumWeight))
      .hexBinMerge(true)
      .enablePointerInteraction(false); // performance improvement

    fetch('../datasets/world_population.csv').then(res => res.text())
      .then(csv => d3.csvParse(csv, ({ lat, lng, pop }) => ({ lat: +lat, lng: +lng, pop: +pop })))
      .then(data => world.hexBinPointsData(data));

    // Add auto-rotation
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.6;
}

worldCities();