import React, { useEffect, useRef } from 'react';
import './FuturisticBackground.css';

const FuturisticBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create floating particles
    const createParticles = () => {
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
        container.appendChild(particle);
      }
    };

    // Create low-poly shards
    const createShards = () => {
      for (let i = 0; i < 15; i++) {
        const shard = document.createElement('div');
        shard.className = 'poly-shard';
        shard.style.left = Math.random() * 100 + '%';
        shard.style.top = Math.random() * 100 + '%';
        shard.style.animationDelay = Math.random() * 15 + 's';
        shard.style.animationDuration = (Math.random() * 30 + 20) + 's';
        
        // Random shard shape
        const shardType = Math.floor(Math.random() * 3);
        shard.classList.add(`shard-type-${shardType}`);
        
        container.appendChild(shard);
      }
    };

    // Create depth layers
    const createDepthLayers = () => {
      for (let layer = 0; layer < 3; layer++) {
        const layerDiv = document.createElement('div');
        layerDiv.className = `depth-layer layer-${layer}`;
        
        for (let i = 0; i < 8; i++) {
          const element = document.createElement('div');
          element.className = 'depth-element';
          element.style.left = Math.random() * 100 + '%';
          element.style.top = Math.random() * 100 + '%';
          element.style.animationDelay = Math.random() * 20 + 's';
          layerDiv.appendChild(element);
        }
        
        container.appendChild(layerDiv);
      }
    };

    createParticles();
    createShards();
    createDepthLayers();

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="futuristic-background" ref={containerRef}>
      {/* Volumetric fog layers */}
      <div className="fog-layer fog-1"></div>
      <div className="fog-layer fog-2"></div>
      <div className="fog-layer fog-3"></div>
      
      {/* Neon rim lights */}
      <div className="rim-light rim-light-1"></div>
      <div className="rim-light rim-light-2"></div>
      <div className="rim-light rim-light-3"></div>
      
      {/* Bloom effects */}
      <div className="bloom-effect bloom-1"></div>
      <div className="bloom-effect bloom-2"></div>
      
      {/* Camera drift overlay */}
      <div className="camera-drift"></div>
    </div>
  );
};

export default FuturisticBackground;