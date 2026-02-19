import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * 3D Brain viewer – loads PLY mesh, applies heatmap overlay and region labels.
 */
const ThreeBrainView = ({ plyUrl }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!plyUrl || !mountRef.current) return;

    const container = mountRef.current;
    container.innerHTML = "";
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 0, 600);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(300, 300, 300);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(-300, 0, -300);
    scene.add(rimLight);

    const labels = [];
    const lines = [];

    const createLabelWithLine = (text, regionPos, offset, color = "#ffffff") => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.roundRect(0, 20, 256, 60, 10);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(text, 128, 60);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(material);

      const labelPos = regionPos.clone().add(offset);
      sprite.position.copy(labelPos);
      sprite.scale.set(60, 30, 1);
      sprite.renderOrder = 999;
      scene.add(sprite);

      labels.push({ sprite, regionPos, offset });

      const geometry = new THREE.BufferGeometry().setFromPoints([
        regionPos.clone(),
        labelPos.clone(),
      ]);
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0x4ade80,
          linewidth: 2,
          transparent: true,
          opacity: 0.6,
        })
      );
      scene.add(line);
      lines.push({ line, regionPos, offset });
    };

    const loader = new PLYLoader();
    loader.load(plyUrl, (geo) => {
      geo.computeVertexNormals();
      const pos = geo.attributes.position;

      geo.computeBoundingBox();
      const box = geo.boundingBox;
      const center = new THREE.Vector3();
      box.getCenter(center);
      geo.translate(-center.x, -center.y, -center.z);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 350 / maxDim;

      const material = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const originalMesh = new THREE.Mesh(geo.clone(), material);
      originalMesh.scale.setScalar(scale);
      scene.add(originalMesh);

      const heatColors = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        let r = 0,
          g = 0,
          b = 0;
        if (z > 40) {
          r = 1;
          g = 0.2;
          b = 0.2;
        } else if (z < -40) {
          r = 0.2;
          g = 0.4;
          b = 1;
        } else if (y < -30) {
          r = 1;
          g = 1;
          b = 0;
        } else {
          r = 0.1;
          g = 0.8;
          b = 0.1;
        }
        heatColors[i * 3] = r;
        heatColors[i * 3 + 1] = g;
        heatColors[i * 3 + 2] = b;
      }

      const heatGeo = geo.clone();
      heatGeo.setAttribute("color", new THREE.BufferAttribute(heatColors, 3));
      const heatMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const heatMesh = new THREE.Mesh(heatGeo, heatMaterial);
      heatMesh.scale.setScalar(scale);
      scene.add(heatMesh);

      createLabelWithLine(
        "Frontal Lobe",
        new THREE.Vector3(0, 60, 80).multiplyScalar(scale),
        new THREE.Vector3(0, 40, 40)
      );
      createLabelWithLine(
        "Temporal Lobe",
        new THREE.Vector3(60, -20, 0).multiplyScalar(scale),
        new THREE.Vector3(50, 0, 0)
      );
      createLabelWithLine(
        "Hippocampus",
        new THREE.Vector3(20, -30, 20).multiplyScalar(scale),
        new THREE.Vector3(40, 20, 0),
        "#fbbf24"
      );
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (container) container.innerHTML = "";
      renderer.dispose();
    };
  }, [plyUrl]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-2xl overflow-hidden cursor-move"
    />
  );
};

export default ThreeBrainView;
