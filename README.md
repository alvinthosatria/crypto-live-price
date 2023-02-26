# crypto-realtime-price
App developed with data fetched from CoinCap API 2.0 https://docs.coincap.io/

Front-end developed with:  
-ReactJS + Vite  
-Styled-components CSS  

Back-end developed with:  
-NodeJS and ExpressJS  

Minimized API call with node caching and attempt to create Nginx reverse proxy server for load balancing.  
Dockerfile made for frontend, backend and nginx config.  

System design  
Client <--WebSocket--> Backend <--API CALL  

System design with NGINX (improve concurrent handling of users)  
Client <--WebSocket--> Proxy server <--WebSocket--> Backend <--API CALL  

Proxy server is configured to do load balancing based on least connections.  
