import React, { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  speed: number
  color: string
  size: number
}

const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a55eea', '#26de81', '#fd79a8']
    const newPieces: ConfettiPiece[] = []

    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        rotation: Math.random() * 360,
        speed: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4
      })
    }

    setPieces(newPieces)

    const interval = setInterval(() => {
      setPieces(prev =>
        prev.map(piece => ({
          ...piece,
          y: piece.y + piece.speed,
          rotation: piece.rotation + piece.speed * 2,
          x: piece.x + Math.sin(piece.y * 0.01) * 0.5
        })).filter(piece => piece.y < window.innerHeight + 50)
      )
    }, 50)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPieces([])
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            opacity: 0.8
          }}
        />
      ))}
    </div>
  )
}

export default Confetti