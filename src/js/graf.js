class Graph {
  constructor() {
    this.nodes = new Set();
    this.edges = new Map();
  }

  // Method untuk menambah titik/node
  addNode(node) {
    this.nodes.add(node);
    this.edges.set(node, []);
  }

  // Method untuk menambah sisi dan jarak/bobot
  addEdge(node1, node2, weight) {
    this.edges.get(node1).push({ node: node2, weight });
    this.edges.get(node2).push({ node: node1, weight });
  }

  // Implementasi Algoritma Dijkstra
  dijkstra(startNode) {
    const distances = {};
    const previousNodes = {};
    const visited = {};
    const priorityQueue = new MinHeap();

    for (const node of this.nodes) {
      distances[node] = Infinity;
      previousNodes[node] = null;
      visited[node] = false;
    }

    distances[startNode] = 0;
    priorityQueue.insert({ node: startNode, distance: 0 });

    while (!priorityQueue.isEmpty()) {
      const { node, distance } = priorityQueue.extractMin();

      if (visited[node]) continue;
      visited[node] = true;

      for (const neighbor of this.edges.get(node)) {
        const newDistance = distance + neighbor.weight;

        if (newDistance < distances[neighbor.node]) {
          distances[neighbor.node] = newDistance;
          previousNodes[neighbor.node] = node;
          priorityQueue.insert({ node: neighbor.node, distance: newDistance });
        }
      }
    }

    return { distances, previousNodes };
  }

  getPath(startNode, endNode, previousNodes) {
    const path = [];
    let current = endNode;

    while (current !== startNode) {
      path.unshift(current);
      current = previousNodes[current];
    }

    path.unshift(startNode);
    return path;
  }

  shortestPathBetweenPaths(startNode, endNode) {
    const { distances, previousNodes } = this.dijkstra(startNode);
    const shortestDistance = distances[endNode];
    const path = this.getPath(startNode, endNode, previousNodes);

    return { shortestDistance, path };
  }
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  insert(element) {
    this.heap.push(element);
    this.bubbleUp();
  }

  extractMin() {
    if (this.isEmpty()) {
      return null;
    }

    const min = this.heap[0];
    const last = this.heap.pop();

    if (!this.isEmpty()) {
      this.heap[0] = last;
      this.heapifyDown();
    }

    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  bubbleUp() {
    let index = this.heap.length - 1;

    while (index > 0) {
      const element = this.heap[index];
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];

      if (element.distance >= parent.distance) break;

      this.heap[index] = parent;
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  heapifyDown() {
    let index = 0;

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallest = index;

      if (
        leftChildIndex < this.heap.length &&
        this.heap[leftChildIndex].distance < this.heap[smallest].distance
      ) {
        smallest = leftChildIndex;
      }

      if (
        rightChildIndex < this.heap.length &&
        this.heap[rightChildIndex].distance < this.heap[smallest].distance
      ) {
        smallest = rightChildIndex;
      }

      if (smallest === index) break;

      const temp = this.heap[index];
      this.heap[index] = this.heap[smallest];
      this.heap[smallest] = temp;
      index = smallest;
    }
  }
}

const kotaAwalOption = document.getElementById('kotaAwal');
const kotaTujuanOption = document.getElementById('kotaTujuan');
const formRute = document.getElementById('formRute');
const hasil = document.getElementById('hasil');
const kotaAwalHasil = document.getElementById('kotaAwalHasil');
const kotaTujuanHasil = document.getElementById('kotaTujuanHasil');
const totalJarak = document.getElementById('totalJarak');
const jalurHasil = document.getElementById('jalurHasil');
const hapusRute = document.getElementById('hapusRute');

// Inisialisasi map
let map = L.map('map', {
  center: [-7.974918, 112.635269],
  zoom: 13
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let routingControl = null;

// Menyimpan class Graph
const graph = new Graph();

// Menambah titik/node
graph.addNode("Malang"); //A
graph.addNode("Surabaya"); //B
graph.addNode("Trenggalek"); //C
graph.addNode("Wonogiri"); //D
graph.addNode("Semarang"); //E
graph.addNode("Rembang"); //F

// Menambah sisi dengan jarak/bobot
graph.addEdge("Malang", "Surabaya", 92);
graph.addEdge("Malang", "Trenggalek", 134);
graph.addEdge("Surabaya", "Trenggalek", 181);
graph.addEdge("Surabaya", "Wonogiri", 259);
graph.addEdge("Surabaya", "Rembang", 198);
graph.addEdge("Trenggalek", "Wonogiri", 113);
graph.addEdge("Wonogiri", "Semarang", 133);
graph.addEdge("Wonogiri", "Rembang", 181);
graph.addEdge("Rembang", "Semarang", 120);

let startNode = null; // Titik berangkat
let endNode = null; // Titik tujuan

let latLngStartNode, latLngEndNode; // Variabel untuk menyimpan lat dan lng kota awal dan kota tujuan

// lat dan lng semua kota
const latLngSemuaKota = {
  "Malang": L.latLng(-7.974918, 112.635269),
  "Surabaya": L.latLng(-7.249409, 112.740326),
  "Trenggalek": L.latLng(-8.063309, 111.682892),
  "Wonogiri": L.latLng(-7.817126, 110.926895),
  "Rembang": L.latLng(-6.706379, 111.347809),
  "Semarang": L.latLng(-6.991859, 110.423241),
}

kotaAwalOption.addEventListener('change', function () {
  startNode = this.value;
})

kotaTujuanOption.addEventListener('change', function () {
  endNode = this.value;
})

formRute.addEventListener('submit', (e) => {
  e.preventDefault();

  // Memulai proses untuk mencari jarak dan jalur terpendek
  const { shortestDistance, path } = graph.shortestPathBetweenPaths(startNode, endNode);
  const waypoint_1 = latLngSemuaKota[`${startNode}`];
  const waypoint_2 = latLngSemuaKota[`${endNode}`];

  hasil.classList.remove("hidden");

  kotaAwalHasil.innerText = `Kota ${startNode}`;
  kotaTujuanHasil.innerText = `Kota ${endNode}`;
  totalJarak.innerText = `${shortestDistance} km`;
  jalurHasil.innerText = path.join(" -> ");

  map._zoom = 1;

  if (routingControl != null) {
    map.removeControl(routingControl);
    routingControl = null;
  }

  routingControl = L.Routing.control({
    waypoints: [
      waypoint_1,
      waypoint_2
    ],
    lineOptions: {
      styles: [{
        color: '#6366f1',
        weight: 9,
        opacity: 0.8
      }],
    },
    plan: L.Routing.plan([
      waypoint_1,
      waypoint_2
    ], {
      draggableWaypoints: false,
    }),
    show: false,
  }).addTo(map);
});