import React from 'react'
import styled from 'styled-components';

const Card = ({ item }) => {
  return (
    <Container>
        <Cryptocurrency>{item.name}</Cryptocurrency>
        <Price>${item.price}</Price>

        <OtherInfo>
            <Volume>
            <Caption>volume:</Caption>
            <VolumeValue>{item.volume}</VolumeValue>
            </Volume>

            <Change>
            <Caption>change:</Caption>
            {
                parseFloat(item.change) > 0 
                ? <ChangeValue positive>{item.change}</ChangeValue> 
                : <ChangeValue>{item.change}</ChangeValue>
            }
            
            </Change>
        </OtherInfo>
    </Container>
  )
}

const Container = styled.div`
  width: 300px;
  height: 150px;
  border: 1px solid gray;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
`;

const Cryptocurrency = styled.div`
  font-size: 28px;
  font-weight: bold;
`;

const Price = styled.div`
  font-size: 18px;
  color: #f5ae33;
  font-weight: 600;
  margin: 10px 0px;
`;

const OtherInfo = styled.div`
  display: flex;
  gap: 40px;
`;

const Volume = styled.div`
  color: #a6a6a6;
`;

const VolumeValue = styled.div`
  color: #a6a6a6;
`;

const Change = styled.div``;

const ChangeValue = styled.div`
  color: ${props => props.positive ? "#97da46" : "#d21822"};
`;

const Caption = styled.div`
  color: #9f9f9f;
  font-size: 16px;
  font-weight: bold;
`;

export default Card