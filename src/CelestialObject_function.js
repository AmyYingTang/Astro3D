function CelestialObject({ obj, index }) {
  console.log(`......................: ${obj.wikiUrl}`);
  const { imageUrl, loading } = useWikipediaImage(extractWikiTitle(obj.wikiUrl));
  const [x, y, z] = raDecToXYZ(convertRA(obj.ra), convertDEC(obj.dec), astronomicalScore(obj.dist));
  const color = new THREE.Color(`hsl(${(index * 25) % 360}, 80%, 60%)`);
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    const wikiUrl = `${obj.wikiUrl}`;
    window.open(wikiUrl, '_blank');
  };

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const InfoPanel = () => (
    <Html position={[0, imageUrl ? 0.25 : 0.15, 0]} center distanceFactor={10}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontSize: '7px',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#4a9eff' }}>
          {obj.name}
        </div>
        <div>RA: {convertRA(obj.ra).toFixed(2)}°</div>
        <div>DEC: {convertDEC(obj.dec) > 0 ? '+' : ''}{convertDEC(obj.dec).toFixed(2)}°</div>
        <div>Distance: {obj.dist} light years</div>
        <div style={{ marginTop: '5px', fontSize: '7px', color: '#aaa' }}>
          {loading ? 'Loading...' : 'Click to view on Wikipedia →'}
        </div>
      </div>
    </Html>
  );

  if (imageUrl && !loading) {
    return (
      <group position={[x, y, z]}>
        <ImageSprite 
          imageUrl={imageUrl} 
          size={0.3}
          onClick={handleClick}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        />
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.01}
          outlineColor="black"
        >
          {obj.name}
        </Text>
        {hovered && <InfoPanel />}
      </group>
    );
  }

  return (
    <group position={[x, y, z]}>
      <mesh
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        {/* <meshBasicMaterial 
          color={loading ? "#666" : color}
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.5 : 0}
        /> */}
      </mesh>
      <Text
        position={[0.1, 0.1, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="left"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="black"
      >
        {obj.name}
      </Text>
      {hovered && <InfoPanel />}
      {loading && (
        <Html position={[0, -0.15, 0]} center>
          <div style={{ 
            color: 'yellow', 
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            loading...
          </div>
        </Html>
      )}
    </group>
  );
}