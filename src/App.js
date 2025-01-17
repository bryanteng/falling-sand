import React, { useRef, useEffect, useState } from "react"

const App = () => {
  const DEFAULT_WIDTH = 600
  const DEFAULT_HEIGHT = 500
  const CELL_SIZE = 5
  const INTERVAL = 2 // refresh rate in ms
  const canvasRef = useRef(null)
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_WIDTH)
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_HEIGHT)
  
  // divides canvas into a grid by cell size
  const [cols, setCols] = useState(Math.floor(canvasWidth / CELL_SIZE))
  const [rows, setRows] = useState(Math.floor(canvasHeight / CELL_SIZE))

  const createGrid = () =>{
    if(!cols || !rows) return Array.from({ length: 10 }, () => Array(10).fill(null)) // debug create a default grid if cols or rows are 0
    return Array.from({ length: cols }, () => Array(rows).fill(null))
  }

  const [grid, setGrid] = useState(createGrid())
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [mousePosition, setMousePosition] = useState(null)
  const [dropRadius, setDropRadius] = useState(1) // drop 1x1 square of sand, 2x2, 3x3, etc.
  const [reverseGravity, setReverseGravity] = useState(false); // space mode

  useEffect(() => {
    setCols(Math.floor(canvasWidth / CELL_SIZE))
    setRows(Math.floor(canvasHeight / CELL_SIZE))
    setGrid((prevGrid) => {
      const newGrid = Array.from({ length: rows }, (_, y) =>
        Array.from({ length: cols }, (_, x) =>
          y < prevGrid.length && x < prevGrid[0].length ? prevGrid[y][x] : null
        )
      )
      return newGrid
    })
  }, [canvasWidth, canvasHeight])

  // Draw the grid on the canvas
  const drawGrid = (ctx, grid) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight) 

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = getColor(grid[y][x])
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
    }
  }

  const getColor = (type) => {
    if (type === "sand") return "#f4a261" // sand
    return "#fff" // default white
  }

  // update grid to simulate falling sand
  const updateGrid = (grid) => {
    const newGrid = grid.map((row) => [...row])

    // space mode :)
    if (reverseGravity) {
      for (let y = 1; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y][x] === "sand" && !grid[y - 1][x]) {
            newGrid[y - 1][x] = "sand"
            newGrid[y][x] = null
          }
        }
      }
    } else {
      // regular gravity
      for (let y = rows - 2; y >= 0; y--) {
        for (let x = 0; x < cols; x++) {
          if (grid[y][x] === "sand") {
            if (!grid[y + 1]?.[x]) {
            // move down
              newGrid[y + 1][x] = "sand"
              newGrid[y][x] = null
            } else if (x > 0 && !grid[y + 1]?.[x - 1]) {
            // move diagonally left
              newGrid[y + 1][x - 1] = "sand"
              newGrid[y][x] = null
            } else if (x < cols - 1 && !grid[y + 1]?.[x + 1]) {
            // move diagonally right
              newGrid[y + 1][x + 1] = "sand"
              newGrid[y][x] = null
            }
          }
        }
      }
    }
  return newGrid
}

  const dropSand = () => {
    if (isMouseDown && mousePosition) {
      const { x, y } = mousePosition

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => [...row])

        const radius = dropRadius - 1
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx
            const ny = y + dy

            // check coordinates bounds
            if (
              ny >= 0 &&
              ny < rows &&
              nx >= 0 &&
              nx < cols &&
              !newGrid[ny][nx]
            ) {
              newGrid[ny][nx] = "sand"
            }
          }
        }

        return newGrid
      })
    }
  }

  // simulate physics and animation by redrawing the gird
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    const interval = setInterval(() => {
      setGrid((prevGrid) => {
        const updatedGrid = updateGrid(prevGrid)
        drawGrid(ctx, updatedGrid)
        return updatedGrid
      })
    }, INTERVAL)

    return () => clearInterval(interval)
  }, [canvasHeight, canvasWidth, reverseGravity])

  // drop sand continuously while the mouse down
  useEffect(() => {
    const interval = setInterval(() => {
      dropSand()
    }, INTERVAL)

    return () => clearInterval(interval)
  }, [isMouseDown, mousePosition])

  // add/remove event listeners 
  useEffect(() => {
    const handleMouseUpGlobal = () => {
      setIsMouseDown(false)
    }
    window.addEventListener("mouseup", handleMouseUpGlobal)

    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal)
    }
  }, [])

  const updateMousePosition = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE)
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE)
    console.log(rect, x, y)

    setMousePosition({ x, y })
  }

  const handleMouseDown = (e) => {
    setIsMouseDown(true)
    updateMousePosition(e)
  }

  const handleMouseMove = (e) => {
    if (isMouseDown) {
      updateMousePosition(e)
    }
  }

  const handleMouseUp = () => {
    setIsMouseDown(false)
  }

  const handleCanvasWidthChange = (e) => {
    setCanvasWidth(parseInt(e.target.value, 10))
  }

  const handleCanvasHeightChange = (e) => {
    setCanvasHeight(parseInt(e.target.value, 10))
  }

  const toggleGravity = () => {
    setReverseGravity((prev) => !prev);
  };

  /*
    To do:
    - Add more types of cells (water, stone, etc.)
    - changeable sand colors, gradients, rainbows, etc.
    - change to animate frame
    - width control spans width of canvas, height control spans height of canvas
    - general style changes, sidebar, settings, change background normal mode, space mode ?, etc.
    - preserve sand on resize && add a clear button maybe?
  */

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="width-slider">Canvas Width: </label> 
        <input
          id="width-slider"
          type="range"
          min="600"
          max="1000"
          step={10}
          value={canvasWidth}
          onChange={handleCanvasWidthChange}
        />
        <span> {canvasWidth}</span>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Canvas Height: </label>
        <input
          id="height-slider"
          type="range"
          min="200"
          max="600"
          step={10}
          value={canvasHeight}
          onChange={handleCanvasHeightChange}
        />
        <span> {canvasHeight}</span>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Drop Radius: </label>
        <input
          id="radius-slider"
          type="range"
          min="1"
          max="5"
          value={dropRadius}
          onChange={(e) => setDropRadius(parseInt(e.target.value, 10))}
        />
        <span> {dropRadius}</span>
      </div>

      <button onClick={toggleGravity}>
        {reverseGravity ? "normal gravity" : "reverse gravity"}
      </button>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ border: "1px solid black", cursor: "pointer" }}
      />
    </div>
  )
}

export default App
