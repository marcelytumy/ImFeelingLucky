import { useState, useEffect, useRef } from 'preact/hooks';

interface WheelProps {
  websites: string[];
  onSelect: (website: string) => void;
}

export function Wheel({ websites, onSelect }: WheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [currentSegmentNames, setCurrentSegmentNames] = useState<string[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);

  const numSegments = websites.length > 0 ? websites.length : 1; // Avoid division by zero
  const segmentAngle = 360 / numSegments;

  // Update segment names when websites change
  useEffect(() => {
    if (websites.length > 0) {
      setCurrentSegmentNames(websites.map(site => {
        try {
          const url = new URL(site.startsWith('http') ? site : `https://${site}`);
          let name = url.hostname.replace(/^www\./, '');
          name = name.split('.')[0]; // Get main part of domain
          return name.length > 15 ? name.substring(0, 12) + '...' : name; // Truncate long names
        } catch {
          return site.length > 15 ? site.substring(0, 12) + '...' : site; // Fallback for invalid URLs
        }
      }));
    }
  }, [websites]);

  const spin = () => {
    if (spinning || websites.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * websites.length);
    
    // Calculate rotation to align the pointer with the top (0 degrees or 360 degrees)
    // The pointer is at the top, so we want the chosen segment's center to end up at the top.
    // Current rotation + additional rotation = n * 360 + targetAngle (where targetAngle is where the segment should land)
    // We want the segment to land at 270 degrees from the top if we consider 0 degrees to be right, like in CSS transforms.
    // However, our pointer is at the top, so we want the segment to effectively be at 0 degrees relative to the pointer.
    
    const fullSpins = 5; // Number of full rotations for visual effect
    const baseRotation = fullSpins * 360;
    
    // We need to calculate the rotation required to bring the center of the target segment to the top (0 degrees).
    // The wheel rotates clockwise. If a segment's center is at `targetSegmentCenterAngle`,
    // we need to rotate by `-(targetSegmentCenterAngle)` to bring it to the top, plus full spins.
    // To make it spin more, we add to the current rotation.
    // The final angle of the wheel should be such that the chosen segment is at the top.
    // Let R_current be the current rotation. We want R_final.
    // The segment i is currently from i*segmentAngle to (i+1)*segmentAngle.
    // Its center is at (i+0.5)*segmentAngle.
    // After rotation R, its center is at (i+0.5)*segmentAngle - R (modulo 360).
    // We want (randomIndex+0.5)*segmentAngle - R_final = 0 (or 360k for some integer k).
    // So, R_final = (randomIndex+0.5)*segmentAngle - 360k.
    // To ensure it spins forward and enough times:
    // R_final = R_current + baseRotation + (current_angle_of_target_segment_center - desired_final_angle_of_pointer)
    // The pointer is fixed at the top (like 12 o'clock).
    // We want the chosen segment to stop under this pointer.
    // The angle of the start of segment 0 is at the top when rotation is 0.
    // The center of segment `randomIndex` is at `(randomIndex + 0.5) * segmentAngle`.
    // We want this angle to be at the top. So, the wheel needs to rotate such that this angle aligns with the pointer.
    // The final rotation value should be such that `(rotation + (randomIndex + 0.5) * segmentAngle) % 360` effectively points to the chosen segment.
    // Let's simplify: the `rotation` state variable is the amount the wheel *has rotated*.
    // We want to add more rotation.
    // The target angle for the *start* of the chosen segment to align with the top (0 deg) is `-(randomIndex * segmentAngle)`.
    // To make it more visually appealing, we add some randomness and ensure it spins a few times.

    const randomOffsetWithinSegment = (Math.random() - 0.5) * segmentAngle * 0.8; // Spin to somewhere within the segment, not just center
    
    // Calculate the rotation needed to bring the start of the chosen segment to the top, then adjust by random offset.
    const rotationToAlignStart = -(randomIndex * segmentAngle);
    // Total rotation to add
    const additionalRotation = baseRotation + rotationToAlignStart - randomOffsetWithinSegment;

    setRotation(prev => prev + additionalRotation);
    setSpinning(true);

    // Adjust timeout to match CSS transition duration
    setTimeout(() => {
      setSpinning(false);
      onSelect(websites[randomIndex]);
      
      // Normalize rotation to keep it within a manageable range (e.g., 0-360) after spin, to prevent large numbers if desired
      // Although for continuous spinning, adding is fine. If we want to reset or show a specific final state, normalization is good.
      // setRotation(prev => (prev + additionalRotation) % 360); // Optional: normalize final rotation
    }, 5000); // Corresponds to duration-[5000ms]
  };

  const colors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#5EEAD4', '#FACC15'];
  
  const gradientSegments = websites.length > 0 ? currentSegmentNames.map((_, i) => {
    const color = colors[i % colors.length];
    return `${color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`;
  }).join(', ') : 'transparent 0deg 360deg'; // Fallback for no websites

  return (
    <div className="flex flex-col items-center space-y-6 sm:space-y-8">
      <div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 select-none">
        {/* Wheel */}
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full border-4 border-gray-700 dark:border-gray-500 shadow-lg transition-transform duration-[5000ms] ease-out overflow-hidden relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${gradientSegments})`, // Removed radial-gradient
          }}
        >
          {/* Segment Names & Lines */}
          {websites.length > 0 && currentSegmentNames.map((name, i) => {
            const angle = (i * segmentAngle) + (segmentAngle / 2); // Center angle of the segment
            const textRotation = -rotation; // Counter-rotate text so it stays upright
            const radius = wheelRef.current ? wheelRef.current.offsetWidth / 2 * 0.65 : 0; // Position text within the wheel

            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-center"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translate(0, -${radius}px) rotate(${-angle}deg) rotate(${textRotation}deg)`,
                  textAlign: 'center',
                  width: `${segmentAngle * Math.PI / 180 * radius * 0.8}px`, // Approximate width for text container
                  color: 'rgba(0,0,0,0.7)', // Darker text for better readability on light colors
                  fontSize: websites.length > 15 ? '0.6rem' : '0.75rem',
                  fontWeight: '500',
                  textShadow: '1px 1px 1px rgba(255,255,255,0.3)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {name}
              </div>
            );
          })}

          {/* Faint slice separators (optional, can be removed if text provides enough separation) */}
          {websites.length > 1 && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `repeating-conic-gradient(
                  from 0deg,
                  transparent 0deg ${segmentAngle - 0.5}deg,
                  rgba(0,0,0,0.15) ${segmentAngle - 0.5}deg ${segmentAngle}deg
                )`,
              }}
            />
          )}

          {/* Central hub for a knob effect */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                       w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-600 dark:bg-gray-500 border-2 sm:border-4 border-gray-500 dark:border-gray-400"
          />
        </div>
        
        {/* Styled Pointer */}
        <div 
          className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 -translate-y-full 
                     w-0 h-0 
                     border-l-[10px] border-r-[10px] border-b-[20px]
                     sm:border-l-[12px] sm:border-r-[12px] sm:border-b-[24px]
                     border-l-transparent border-r-transparent border-b-red-500 
                     z-10"
        />
      </div>
      
      <button
        className={`mt-6 sm:mt-8 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold tracking-wide shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 ${spinning ? 'opacity-70 cursor-not-allowed' : ''}`}
        onClick={spin}
        disabled={spinning || websites.length === 0}
        aria-live="polite"
      >
        {spinning ? 'Spinning...' : (websites.length === 0 ? 'No Websites' : 'Spin the Wheel!')}
      </button>
    </div>
  );
}
