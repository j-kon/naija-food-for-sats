import React from "react";
import { useCart } from "react-use-cart"


function ItemCardModal() {
    
    return (
      <div
        className="modal fade"
        id="exampleModal"
        tabindex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Modal title
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">...</div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}

const Itemcard = (props) => {
    const [isModal, setIsModal] = React.useState(false);
    const { addItem } = useCart();
    return (
      <>
        <div className="col-11 col-md-6 col-lg-3 mx-0 mb-4">
          <div className="card p-0 overflow-hidden h-100 shadow">
            <img src={props.img} className="card-img-top img-fluid" alt="in" />
            <div className="card-body text-center">
              <h5 className="card-title">{props.title}</h5>
              <h5 className="card-title">$ {props.price}</h5>
              <p className="card-text">{props.desc}</p>
              <button
                className="btn btn-success"
                onClick={() => setIsModal(true)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        {isModal && <ItemCardModal />}
      </>
    );
}

export default Itemcard;