/**
 * A* Pathfinding for the hall simulator.
 * Operates on a grid where each cell represents a 10x10 px area.
 */

export const GRID_SIZE = 10;

class Node {
    constructor(x, y, cost = 1) {
        this.x = x;
        this.y = y;
        this.cost = cost;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }
}

export function findPath(start, target, width, height, corridors, obstacles) {
    // Convert to grid coordinates
    const startNode = new Node(Math.floor(start.x / GRID_SIZE), Math.floor(start.y / GRID_SIZE));
    const targetNode = new Node(Math.floor(target.x / GRID_SIZE), Math.floor(target.y / GRID_SIZE));

    const openList = [startNode];
    const closedList = new Set();

    const getHash = (node) => `${node.x},${node.y}`;

    // Create cost map? No, let's calculate on the fly for memory efficiency
    const getCost = (x, y) => {
        const px = x * GRID_SIZE;
        const py = y * GRID_SIZE;

        // Check obstacles (Machines/Warehouses)
        for (let obs of obstacles) {
            if (px >= obs.x && px < obs.x + obs.w && py >= obs.y && py < obs.y + obs.h) {
                return Infinity;
            }
        }

        // Check green corridors (low cost)
        for (let corr of corridors) {
            // Distance to segment
            if (distToSegment({ x: px, y: py }, { x: corr.x1, y: corr.y1 }, { x: corr.x2, y: corr.y2 }) < 20) {
                return 0.1; // 10x cheaper
            }
        }

        return 1; // Normal floor
    };

    while (openList.length > 0) {
        // Find node with lowest f
        let currentIndex = 0;
        for (let i = 0; i < openList.length; i++) {
            if (openList[i].f < openList[currentIndex].f) currentIndex = i;
        }
        const current = openList[currentIndex];

        if (current.x === targetNode.x && current.y === targetNode.y) {
            const path = [];
            let temp = current;
            while (temp) {
                path.push({ x: temp.x * GRID_SIZE, y: temp.y * GRID_SIZE });
                temp = temp.parent;
            }
            return path.reverse();
        }

        openList.splice(currentIndex, 1);
        closedList.add(getHash(current));

        // Neighbors
        const neighbors = [
            { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
        ];

        for (let offset of neighbors) {
            const nx = current.x + offset.x;
            const ny = current.y + offset.y;

            if (nx < 0 || ny < 0 || nx >= width / GRID_SIZE || ny >= height / GRID_SIZE) continue;
            if (closedList.has(`${nx},${ny}`)) continue;

            const cost = getCost(nx, ny);
            if (cost === Infinity) continue;

            const neighbor = new Node(nx, ny, cost);
            const moveCost = (offset.x !== 0 && offset.y !== 0) ? 1.414 : 1;
            const g = current.g + moveCost * cost;

            const existing = openList.find(n => n.x === nx && n.y === ny);
            if (existing && g >= existing.g) continue;

            neighbor.g = g;
            neighbor.h = Math.sqrt((nx - targetNode.x) ** 2 + (ny - targetNode.y) ** 2);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.parent = current;

            if (!existing) openList.push(neighbor);
            else {
                existing.g = g;
                existing.f = neighbor.f;
                existing.parent = current;
            }
        }
    }

    return null; // No path
}

function distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
}
