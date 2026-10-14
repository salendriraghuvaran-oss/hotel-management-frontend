import { useState, useEffect, useCallback } from "react";

const API_URL = "http://localhost:8080/api";

function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [foodNames, setFoodNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const [ordersResponse, foodsResponse] = await Promise.all([
        fetch(`${API_URL}/orders`),
        fetch(`${API_URL}/foods`),
      ]);

      if (!ordersResponse.ok || !foodsResponse.ok) {
        throw new Error("Could not load orders or food items.");
      }

      const allOrders = await ordersResponse.json();
      const foods = await foodsResponse.json();

      const names = {};
      foods.forEach((food) => {
        names[food.id] = food.name;
      });

      setFoodNames(names);

      // Show orders that the kitchen needs to handle.
      const kitchenOrders = allOrders
        .filter((order) =>
          ["ACCEPTED", "PREPARING"].includes(order.status)
        )
        .sort((a, b) => a.id - b.id);

      setOrders(kitchenOrders);

      const itemsByOrder = {};

      await Promise.all(
        kitchenOrders.map(async (order) => {
          const response = await fetch(
            `${API_URL}/orders/${order.id}/items`
          );

          if (!response.ok) {
            throw new Error(`Could not load items for Order #${order.id}.`);
          }

          itemsByOrder[order.id] = await response.json();
        })
      );

      setOrderItems(itemsByOrder);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load kitchen orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 5000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order status.");
      }

      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to update order.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  };

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
      <header
        style={{
          backgroundColor: "#17365d",
          color: "white",
          padding: "25px",
          borderRadius: "10px",
          marginBottom: "25px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 10px" }}>
          👨‍🍳 Kitchen Dashboard
        </h1>
        <p style={{ margin: 0 }}>
          Manage food preparation and mark orders as ready.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Active Kitchen Orders</h2>

        <button
          onClick={fetchOrders}
          style={{
            ...buttonStyle,
            backgroundColor: "#17365d",
          }}
        >
          Refresh Orders
        </button>
      </div>

      <p style={{ color: "#555" }}>
        This dashboard refreshes automatically every 5 seconds.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            color: "#b71c1c",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading kitchen orders...</p>
      ) : orders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
          }}
        >
          <h3>No Active Kitchen Orders</h3>
          <p>Accepted orders will appear here.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {orders.map((order) => (
            <section
              key={order.id}
              style={{
                border: "1px solid #ddd",
                borderLeft:
                  order.status === "ACCEPTED"
                    ? "6px solid #1976d2"
                    : "6px solid #f9a825",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Order #{order.id}
              </h2>

              <p>
                <strong>Table:</strong> {order.tableId}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    color:
                      order.status === "ACCEPTED"
                        ? "#1565c0"
                        : "#ef6c00",
                  }}
                >
                  {order.status}
                </span>
              </p>

              <hr />

              <h3>Food Items</h3>

              {!orderItems[order.id] ? (
                <p>Loading items...</p>
              ) : orderItems[order.id].length === 0 ? (
                <p>No items found.</p>
              ) : (
                <ul style={{ paddingLeft: "20px" }}>
                  {orderItems[order.id].map((item, index) => (
                    <li key={item.id ?? index} style={{ marginBottom: "8px" }}>
                      {foodNames[item.foodId] ||
                        item.foodName ||
                        `Food #${item.foodId}`}
                      {" — "}
                      Qty: {item.quantity}
                    </li>
                  ))}
                </ul>
              )}

              {/* CUSTOMER SPECIAL INSTRUCTIONS */}
<div
  style={{
    marginTop: "15px",
    padding: "12px",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffecb5",
    borderRadius: "8px",
  }}
>
  <h4 style={{ margin: "0 0 8px", color: "#856404" }}>
    📝 Customer Instructions
  </h4>

  {orderItems[order.id]?.some((item) => item.specialInstructions?.trim()) ? (
    <ul style={{ paddingLeft: "20px", margin: 0 }}>
      {orderItems[order.id]
        .filter((item) => item.specialInstructions?.trim())
        .map((item, index) => (
          <li key={item.id ?? index} style={{ marginBottom: "5px" }}>
            <strong>
              {foodNames[item.foodId] ||
                item.foodName ||
                `Food #${item.foodId}`}:
            </strong>{" "}
            {item.specialInstructions}
          </li>
        ))}
    </ul>
  ) : (
    <p style={{ margin: 0 }}>
      No special instructions provided.
    </p>
  )}
</div>

              <hr />

              {order.status === "ACCEPTED" && (
                <button
                  disabled={updatingOrder === order.id}
                  onClick={() =>
                    updateStatus(order.id, "PREPARING")
                  }
                  style={{
                    ...buttonStyle,
                    backgroundColor: "#1976d2",
                    width: "100%",
                    opacity: updatingOrder === order.id ? 0.6 : 1,
                  }}
                >
                  {updatingOrder === order.id
                    ? "Updating..."
                    : "Start Preparing"}
                </button>
              )}

              {order.status === "PREPARING" && (
  <button
    disabled={updatingOrder === order.id}
    onClick={() => updateStatus(order.id, "READY")}
    style={{
      ...buttonStyle,
      backgroundColor: "#2e7d32",
      width: "100%",
      marginTop: "10px",
      opacity: updatingOrder === order.id ? 0.6 : 1,
    }}
  >
    {updatingOrder === order.id
      ? "Updating..."
      : "Mark Ready"}
  </button>
)}

              
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

export default KitchenDashboard;