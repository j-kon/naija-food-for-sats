import React from "react";
import { useCart } from "react-use-cart";
import Modal from "./Components/Modal";
import { useState } from "react";


const Cart = () => {
    const [modalOpen, setModalOpen] = useState(false);

  const {
    isEmpty,
    totalUniqueItems,
    items,
    totalItems,
    cartTotal,
    updateItemQuantity,
    removeItem,
    emptyCart,
  } = useCart();

  if (isEmpty) return <h1 className="text-center">Your Cart is Empty</h1>;
  return (
    <section className="py-4 container">
      <div className="row justify-content-center">
        <div className="col-12">
          <h3>
            Cart ({totalUniqueItems}) total items: ({totalItems})
          </h3>
          <table className="table table-light table-hover m-0">
            <tbody>
              {items.map((item, index) => {
                return (
                  <tr key={index}>
                    <td>
                      <img
                        src={item.img}
                        style={{ height: "6rem" }}
                        alt="product"
                      />
                    </td>
                    <td>{item.title}</td>
                    <td>{item.price}</td>
                    <td>Quantity ({item.quantity})</td>
                    <td>
                      <button
                        className="btn btn-info ms-2"
                        onClick={() =>
                          updateItemQuantity(item?.id, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <button
                        className="btn btn-info ms-2"
                        onClick={() =>
                          updateItemQuantity(item?.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                      <button
                        className="btn btn-denger ms-2"
                        onClick={() => removeItem(item?.id)}
                      >
                        Remove Item
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="col-auto ms-auto">
          <h2>Total Price: $ {cartTotal}</h2>
        </div>
        <div className="col-auto">
          <button className="btn btn-danger m-2" onClick={() => emptyCart()}>
            Clear Cart
          </button>
          <button
            className="btn btn-primary mm-2"
            onClick={() => setModalOpen(true)}
          >
            Buy Now
          </button>
          {modalOpen && <Modal setOpenModal={setModalOpen} />}
        </div>
      </div>
    </section>
  );
};

export default Cart;
