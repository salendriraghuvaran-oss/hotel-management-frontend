import { useEffect, useCallback, useRef, useState } from "react";

const API_URL = "http://localhost:8080/api";

function HotelDashboard() {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [foodNames, setFoodNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");
  const [notification, setNotification] = useState("");
  const knownOrderIdsRef = useRef(null);

  // Fetch orders and sort newest first
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/orders`);

      if (!response.ok) {
        throw new Error("Unable to fetch orders.");
      }

      const data = await response.json();
      setAllOrders(data);
      // Detect newly arrived orders
// Detect newly arrived orders
const currentOrderIds = data.map((order) => order.id);
const previousOrderIds = knownOrderIdsRef.current;

if (previousOrderIds !== null) {
  const newOrders = data.filter(
    (order) =>
      !previousOrderIds.includes(order.id) &&
      order.status !== "DELIVERED"
  );

  if (newOrders.length > 0) {
    const newestOrder = newOrders.reduce((latest, order) =>
      order.id > latest.id ? order : latest
    );

    setNotification(
      `🔔 New order received! Order #${newestOrder.id}`
    );

    // Play a short notification sound
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.25);

        oscillator.onended = () => audioContext.close();
      }
    } catch (error) {
      console.log("Notification sound unavailable.");
    }
  }
}

knownOrderIdsRef.current = currentOrderIds;

knownOrderIdsRef.current = currentOrderIds;
      const foodsResponse = await fetch(`${API_URL}/foods`);

if (!foodsResponse.ok) {
  throw new Error("Unable to load food names.");
}

const foodsData = await foodsResponse.json();

const namesById = {};

foodsData.forEach((food) => {
  namesById[food.id] = food.name;
});

setFoodNames(namesById);

      // Sort orders by creation time, newest first
      const sortedOrders = [...data].sort((a, b) => {
        const timeA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const timeB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return timeB - timeA;
      });

      const activeOrders = sortedOrders.filter(
  (order) => order.status !== "DELIVERED"
);

setOrders(activeOrders);

      // Fetch items for every order
      const itemsByOrder = {};

      await Promise.all(
        sortedOrders.map(async (order) => {
          const itemsResponse = await fetch(
            `${API_URL}/orders/${order.id}/items`
          );

          if (!itemsResponse.ok) {
            throw new Error(
              `Unable to load items for order ${order.id}.`
            );
          }

          itemsByOrder[order.id] = await itemsResponse.json();
        })
      );

      setOrderItems(itemsByOrder);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(
        err.message || "Unable to load the hotel dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  fetchOrders();

  const intervalId = setInterval(() => {
    fetchOrders();
  }, 5000);

  return () => {
    clearInterval(intervalId);
  };
}, [fetchOrders]);

  // Update order status
  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      setError("");

      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Unable to update order status."
        );
      }

      await fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
      setError(
        err.message || "Unable to update order status."
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Determine the next order action
  const getNextAction = (status) => {
  switch (status) {
    case "PENDING":
      return {
        status: "ACCEPTED",
        label: "Accept Order",
      };

    case "PREPARING":
      return {
        status: "READY",
        label: "Mark Ready",
      };

    case "READY":
      return {
        status: "DELIVERED",
        label: "Mark Delivered",
      };

    default:
      return null;
  }
};
 // Dashboard statistics
const totalOrders = allOrders.length;

const pendingOrders = allOrders.filter(
  (order) => order.status === "PENDING"
).length;

const preparingOrders = allOrders.filter(
  (order) => order.status === "PREPARING"
).length;

const completedOrders = allOrders.filter(
  (order) => order.status === "DELIVERED"
).length;
  // Search and filter orders
const filteredOrders = orders.filter((order) => {
  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    String(order.id).includes(search) ||
    String(order.tableId).includes(search);

  const matchesStatus =
    statusFilter === "ALL" ||
    order.status === statusFilter;

  return matchesSearch && matchesStatus;
});






  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "25px",
        fontFamily: "Arial, sans-serif",
        color: "#222",
      }}
    >
      {/* DASHBOARD HEADER */}
      <header
        style={{
          backgroundColor: "#17365d",
          color: "white",
          padding: "25px",
          borderRadius: "10px",
          marginBottom: "25px",
        }}
      >
        <h1 style={{ margin: "0 0 10px" }}>
          🏨 Hotel Staff Dashboard
        </h1>

        <p style={{ margin: 0 }}>
          Manage customer orders and track kitchen preparation.
        </p>
      </header>


      {/* DASHBOARD STATISTICS */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  }}
>
  <div style={{ backgroundColor: "#e3f2fd", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
    <h3>Total Orders</h3>
    <h2>{totalOrders}</h2>
  </div>

  <div style={{ backgroundColor: "#fff3e0", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
    <h3>Pending Orders</h3>
    <h2>{pendingOrders}</h2>
  </div>

  <div style={{ backgroundColor: "#f3e5f5", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
    <h3>Preparing Orders</h3>
    <h2>{preparingOrders}</h2>
  </div>

  <div style={{ backgroundColor: "#e8f5e9", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
    <h3>Completed Orders</h3>
    <h2>{completedOrders}</h2>
  </div>
</div>

      {/* NEW ORDER NOTIFICATION */}
{notification && (
  <div
    role="alert"
    style={{
      backgroundColor: "#d1e7dd",
      color: "#0f5132",
      border: "1px solid #badbcc",
      padding: "15px",
      marginBottom: "20px",
      borderRadius: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "10px",
    }}
  >
    <strong>{notification}</strong>

    <button
      onClick={() => setNotification("")}
      style={{
        padding: "6px 12px",
        cursor: "pointer",
        border: "none",
        borderRadius: "4px",
      }}
    >
      Dismiss
    </button>
  </div>
)}

      {/* ORDER LIST HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Customer Orders</h2>

        <button
          onClick={fetchOrders}
          disabled={loading}
          style={{
            padding: "10px 18px",
            backgroundColor: "#17365d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Refresh Orders"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <p>Loading customer orders...</p>
      )}

      {/* ERROR */}
      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            color: "#842029",
            backgroundColor: "#f8d7da",
            borderRadius: "6px",
          }}
        >
          <p>{error}</p>

          <button onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      )}

      {/* SEARCH AND FILTER ORDERS */}
<div
  style={{
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  }}
>
  <input
    type="text"
    placeholder="Search by Order ID or Table Number"
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    style={{
      flex: "1",
      minWidth: "220px",
      padding: "12px",
      border: "1px solid #ccc",
      borderRadius: "6px",
    }}
  />

  <select
    value={statusFilter}
    onChange={(event) => setStatusFilter(event.target.value)}
    style={{
      padding: "12px",
      border: "1px solid #ccc",
      borderRadius: "6px",
      minWidth: "170px",
    }}
  >
    <option value="ALL">All Statuses</option>
    <option value="PENDING">Pending</option>
    <option value="ACCEPTED">Accepted</option>
    <option value="PREPARING">Preparing</option>
    <option value="READY">Ready</option>
  </select>

  <button
    onClick={() => {
      setSearchTerm("");
      setStatusFilter("ALL");
    }}
    style={{
      padding: "12px 18px",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    }}
  >
    Clear Filters
  </button>
</div>

      {/* EMPTY ORDERS */}
      {!loading && !error && orders.length === 0 && (
        <div
          style={{
            padding: "25px",
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h3>No Orders Yet</h3>

          <p>
            Customer orders will appear here when they are placed.
          </p>
        </div>
      )}

      {/* NO MATCHING ORDERS */}
{!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
  <div
    style={{
      textAlign: "center",
      padding: "30px",
      backgroundColor: "#fff3cd",
      borderRadius: "8px",
      marginBottom: "20px",
    }}
  >
    <h3>No Matching Orders Found</h3>
    <p>Try changing your search term or selecting a different status.</p>
  </div>
)}

      {/* ORDERS SORTED NEWEST FIRST */}
      <div style={{ display: "grid", gap: "20px" }}>
        {filteredOrders.map((order) => {
          const nextAction = getNextAction(order.status);
          const items = orderItems[order.id] || [];

          return (
            <article
              key={order.id}
              style={{
                backgroundColor: "white",
                border: "1px solid #d9dee5",
                borderRadius: "10px",
                padding: "22px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* ORDER DETAILS */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ marginTop: 0 }}>
                    Order #{order.id}
                  </h3>

                  <p>
                    <strong>Table Number:</strong>{" "}
                    {order.tableId}
                  </p>

                  <p>
                    <strong>Hotel ID:</strong>{" "}
                    {order.hotelId}
                  </p>

                  <p>
                    <strong>Order Time:</strong>{" "}
                    {order.createdAt
                      ? new Date(
                          order.createdAt
                        ).toLocaleString()
                      : "Not available"}
                  </p>
                </div>

                <span
                  style={{
                    padding: "8px 13px",
                    borderRadius: "20px",
                    backgroundColor:
                      order.status === "DELIVERED"
                        ? "#d1e7dd"
                        : order.status === "READY"
                        ? "#cff4fc"
                        : order.status === "PREPARING"
                        ? "#fff3cd"
                        : "#e2e3e5",
                    fontWeight: "bold",
                  }}
                >
                  {order.status}
                </span>
              </div>

              <hr />

              {/* ORDER ITEMS */}
              <h4>Ordered Items</h4>

              {items.length === 0 ? (
                <p>No item details available.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "#f1f3f5",
                        }}
                      >
                        <th style={tableCellStyle}>
                          Food Name
                        </th>

                        <th style={tableCellStyle}>
                          Quantity
                        </th>

                        <th style={tableCellStyle}>
                          Unit Price
                        </th>

                        <th style={tableCellStyle}>
                          Special Instructions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td style={tableCellStyle}>
                            {foodNames[item.foodId] || `Food #${item.foodId}`}
                          </td>

                          <td style={tableCellStyle}>
                            {item.quantity}
                          </td>

                          <td style={tableCellStyle}>
                            ₹
                            {Number(item.price).toFixed(2)}
                          </td>

                          <td style={tableCellStyle}>
                            {item.specialInstructions?.trim() ||
                              "None"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TOTAL AND STATUS ACTION */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Total: ₹
                  {Number(order.totalAmount || 0).toFixed(2)}
                </h3>

                {nextAction ? (
                  <button
                    onClick={() =>
                      updateStatus(
                        order.id,
                        nextAction.status
                      )
                    }
                    disabled={updatingOrder === order.id}
                    style={{
                      padding: "12px 20px",
                      backgroundColor: "#198754",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        updatingOrder === order.id
                          ? "wait"
                          : "pointer",
                    }}
                  >
                    {updatingOrder === order.id
                      ? "Updating..."
                      : nextAction.label}
                  </button>
                ) : (
                  <strong>Order Completed</strong>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

const tableCellStyle = {
  border: "1px solid #dee2e6",
  padding: "10px",
};

export default HotelDashboard;