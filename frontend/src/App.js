import React, { useState, useEffect } from "react";
import "./App.css";

const media = [
  {
    name: "Tuwo",
    price: 280,
    source: "img1.jpeg",
    invoice: "",
    paymentHash: "",
    buyButton: false,
    checkButton: true,
    fileDownloadUrl: "",
  },
  {
    name: "Amala",
    price: 300,
    source: "img2.jpeg",
    invoice: "",
    paymentHash: "",
    buyButton: false,
    checkButton: true,
    fileDownloadUrl: "",
  },
  {
    name: "Fufu",
    price: 350,
    source: "img3.jpeg",
    invoice: "",
    paymentHash: "",
    buyButton: false,
    checkButton: true,
    fileDownloadUrl: "",
  },
];

function Media(props) {
  const [mediaList, setMedia] = useState(media);
  useEffect(() => [props.invoice, props.fileDownloadUrl]);

  function generateInvoice(source, price) {
    fetch(`/generate-invoice/${source}/${price}`)
      .then((res) => res.json())
      .then((data) => {
        const updateMedia = mediaList.map((m) => {
          if (m.source === source) {
            const updatedMedia = {
              ...m,
              invoice: data.payment_request,
              paymentHash: Buffer.from(data.r_hash).toString("hex"),
              buyButton: true,
              checkButton: false,
            };
            return updatedMedia;
          }
          return m;
        });
        setMedia(updateMedia);
      });
  }

  function checkInvoice(paymentHash) {
    fetch(`/check-invoice/${paymentHash}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settled === true) {
          getContent(data.memo).then((res) => {
            const updateMedia = mediaList.map((m) => {
              if (m.source === data.memo) {
                return {
                  ...m,
                  invoice: "THANKS FOR YOUR ORDER",
                  checkButton: true,
                  fileDownloadUrl: res,
                };
              }
              return m;
            });
            setMedia(updateMedia);
          });
        } else {
          alert("Payment not yet received");
        }
      });
  }

  async function getContent(source) {
    return await fetch(`/file/${source}`)
      .then((res) => res.blob())
      .then((blob) => URL.createObjectURL(blob));
  }

  return (
    <div>
      {mediaList.map((m) => {
        return (
          <div
            key={m.source}
            style={{
              border: "3px solid blue",
              borderRadius: "5px",
              margin: "10px",
              padding: "10px",
              width: "350px",
              display: "inline-block",
              height: "550px",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ margin: "auto", width: "80%" }}>
              <p>{m.name}</p>
              <p>Price: {m.price} sats</p>
              <img
                src={"../assets/" + m.source + ""}
                height="220px"
                alt={m.name}
              />
              <br />
              <button
                className="btn btn-info ms-2"
                disabled={m.buyButton}
                style={{ padding: "10px", margin: "10px" }}
                type="button"
                onClick={() => {
                  generateInvoice(m.source, m.price);
                }}
              >
                Order Now
              </button>
              <button
                className="btn btn-info ms-2"
                disabled={m.checkButton}
                style={{ padding: "10px", margin: "10px" }}
                type="button"
                onClick={() => {
                  checkInvoice(m.paymentHash);
                }}
              >
                Verify Payment
              </button>
              <br></br>
              <textarea
                style={{ resize: "none" }}
                rows="9"
                cols="32"
                value={m.invoice}
                readOnly
              ></textarea>
              <br></br>
              <a
                style={{
                  visibility:
                    !m.checkButton || !m.buyButton ? "hidden" : "visible",
                }}
                href={m.fileDownloadUrl}
                rel="noreferrer"
                target="_blank"
              >
                View
              </a>
              <br></br>
              <a
                style={{
                  visibility:
                    !m.checkButton || !m.buyButton ? "hidden" : "visible",
                }}
                href={m.fileDownloadUrl}
                rel="noreferrer"
                target="_blank"
                download
              >
                Download
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      alias: "",
    };
  }

  componentDidMount() {
    const getInfo = async () => {
      const response = await fetch("/getinfo");
      const { alias } = await response.json();
      this.setState({
        alias,
      });
    };
    getInfo();
  }

  render() {
    return (
      <div>
        <p>{this.state.alias}</p>
        <Media />
      </div>
    );
  }
}

export default App;
