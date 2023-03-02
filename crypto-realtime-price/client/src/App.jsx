import { useState, useEffect} from 'react';
import Card from './components/Card';
import styled from 'styled-components';

function App() {
  const [data, setData] = useState();

  useEffect(() => {
    //initialize WebSocket connection
    //PORT 8800 for the NodeJS server, PORT 80 for the NGINX reverse proxy server
    const ws = new WebSocket("ws://localhost:8800");
    ws.onerror = () => console.error;
    ws.onopen = () => console.log("WebSocket connection established!");
    
    ws.onmessage = (cryptoData) => {
      const info = JSON.parse(cryptoData.data);
      setData(info);
    }

    ws.onclose = () => {
      console.log("Not connected to server!");
      alert("Not connected to server!")
    }
  }, []);

  return (
    <Container>
      <Title>Cryptocurrency Realtime Price</Title>

      {
        data == null 
        ? "Loading..." 
        : 
        <CardContainer>
          {data.map((item) => {
            
            return (
              <div key={item.id}>
                <Card item={item}/>
              </div>
            )
          })}
        </CardContainer>
      }
    </Container>
  )
}

const Container = styled.div`
  font-family: arial;
  width: 85%;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Title = styled.h1`
`;

const CardContainer = styled.div`
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
`;

export default App
