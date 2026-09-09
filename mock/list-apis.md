1. Name: Last Vessel Arrival Declaration by Vessel Name
Description: Provides the corresponding latest vessel arrival declaration information for the given vessel name. The data is updated every hour.
API: Last Vessel Arrival Declaration by Vessel Name (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/arrivaldeclaration/1.0.0/last/vesselname/RADJA SAMUDERA ABADI
Name	Description
vesselname *
string
(path)
Name of the vessel (1-35 chars, must match ^[0-9a-zA-Z-_. ']+$)
Example : RADJA SAMUDERA ABADI
RADJA SAMUDERA ABADI


2. Name: Port Clearance Cert by CallSign
Description: Provides the corresponding port clearance cert information for the given vessel callsign. The data is updated every hour.
API: Port Clearance Cert by CallSign (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/portclearance/1.0.0/callsign/PKJQ?gdvno=850524&certificateno=E84204
Name	Description
callsign *
string
(path)
Vessel call sign (1-8 alphanumeric characters, must match ^[a-zA-Z0-9]+$)
PKJQ

gdvno *
string
(query)
GDV number of the vessel (1-17 alphanumeric characters, must match ^[a-zA-Z0-9]+$)
850524

certificateno *
string
(query)
Alphanumeric certificate ID (1-10 alphanumeric characters, must match ^[a-zA-Z0-9]+$)
E84204

3. Name: Port Clearance Cert by IMO Number
Description: Provides the corresponding port clearance cert information for the given vessel IMO number. The data is updated every hour.
API: Port Clearance Cert by IMO Number (Dynamic / MPA v1.0.0)
URL:https://oceans-x.mpa.gov.sg/api/v1/vessel/portclearance/1.0.0/imonumber/9762156?gdvno=850524&certificateno=E84204
Name	Description
imonumber *
string
(path)
IMO number of vessel (1-10 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : 9762156

gdvno *
string
(query)
GDV number of the vessel (1-17 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : 850524

certificateno *
string
(query)
Alphanumeric certificate ID (1-10 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : E84204

4. Name: Port Clearance Cert by Vessel Name
Description: Provides the corresponding port clearance certs information for the given vessel name. The data is updated every hour.
API: Port Clearance Cert by Vessel Name (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/portclearance/1.0.0/vesselname/RADJA%20SAMUDERA%20ABADI?gdvno=850524&certificateno=E84204
Name	Description
vesselname *
string
(path)
Name of the vessel (1-35 chars, must match ^[0-9a-zA-Z-_. ']+$)

Example : RADJA SAMUDERA ABADI

gdvno *
string
(query)
GDV number of the vessel (1-17 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : 850524

certificateno *
string
(query)
Alphanumeric certificate ID (1-10 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : E84204

5. Name: Vessel Arrival Declaration by CallSign
Description: Provides the corresponding vessel arrival declaration information for the given vessel callsign. The data is updated every hour.
API: Vessel Arrival Declaration by CallSign (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/arrivaldeclaration/1.0.0/callsign/PKJQ
Name	Description
callsign *
string
(path)
CallSign of the vessel (1-8 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : PKJQ

6. Name: Vessel Arrival Declaration by Date
Description: Provides the corresponding vessel arrival declaration information for the given date. The data is updated every hour.
API: Vessel Arrival Declaration by Date (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/arrivaldeclaration/1.0.0/bydate?date=2024-01-23
Name	Description
date *
string
(query)
Date in yyyy-MM-dd format

2024-01-23

7. Name: Vessel Arrival Declaration by IMO Number
Description: Provides the corresponding vessel arrival declaration information for the given vessel IMO number. The data is updated every hour.
API: Vessel Arrival Declaration by IMO Number (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/arrivaldeclaration/1.0.0/imonumber/9762156
Name	Description
imonumber *
string
(path)
IMO number (1-10 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : 9762156

8. Name: Vessel Arrival Declaration by Vessel Name
Description: Provides the corresponding vessel arrival declaration information for the given vessel name. The data is updated every hour.
API: Vessel Arrival Declaration by Vessel Name (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/arrivaldeclaration/1.0.0/vesselname/RADJA%20SAMUDERA%20ABADI
Name	Description
vesselname *
string
(path)
Name of the vessel (1-35 chars, must match ^[0-9a-zA-Z-_. ']+$)

Example : RADJA SAMUDERA ABADI

9. Name: Vessel Arrival Declaration for Past ‘N’ Hours
Description: Provides the corresponding vessels arrival declaration information for the given date and time. The data is updated every hour.
API: Vessel Arrival Declaration for Past ‘N’ Hours (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/arrivaldeclaration/1.0.0/pastNhours?datetime=2024-01-24%2000%3A00%3A00&hours=10
Name	Description
datetime *
string
(query)
Date and time in yyyy-MM-dd HH:mm:ss format

Example : 2024-01-24 00:00:00

2024-01-24 00:00:00
hours *
string
(query)
Number of past hours to query (1-2 digits, optional decimal with up to 2 digits)

Example : 10

10. Name: Vessel Departure Declaration by CallSign
Description: Provides the corresponding vessel departure declaration information for the given vessel callsign. The data is updated every hour.
API: Vessel Departure Declaration by CallSign (Dynamic / MPA v1.0.0)
URL:https://oceans-x.mpa.gov.sg/api/v1/vessel/departuredeclaration/1.0.0/callsign/9VCP7

Name	Description
callsign *
string
(path)
Call sign of vessel (1-8 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : 9VCP7

11. Name: Vessel Departure Declaration by Date
Description: Provides the corresponding vessel departure declaration information for the given date. The data is updated every hour.
API: Vessel Departure Declaration by Date (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/departuredeclaration/1.0.0/bydate?date=2025-07-26

Name	Description
date *
string
(query)
Date in yyyy-MM-dd format

Example : 2025-07-26


12. Name: Vessel Departure Declaration by IMO Number
Description: Provides the corresponding vessel departure declaration information for the given vessel IMO number. The data is updated every hour.
API: Vessel Departure Declaration by IMO Number (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/departuredeclaration/1.0.0/imonumber/1103512

Name	Description
imonumber *
string
(path)
IMO number of vessel (1-10 alphanumeric characters, must match ^[a-zA-Z0-9]+$)

Example : 1103512

13. Name: Vessel Departure Declaration by Vessel Name
Description: Provides the corresponding vessel departure declaration information for the given vessel name. The data is updated every hour.
API: Vessel Departure Declaration by Vessel Name (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/departuredeclaration/1.0.0/vesselname/STELLAR%20OF%20MAJESTIC

Name	Description
vesselname *
string
(path)
Name of the vessel (1-35 chars, must match ^[0-9a-zA-Z-_. ']+$)

Example : STELLAR OF MAJESTIC

14. Name: Vessel Departure Declaration for Past ‘N’ Hours
Description: Provides the corresponding vessels departure declaration information for the given date and time. The data is updated every hour.
API: Vessel Departure Declaration for Past ‘N’ Hours (Dynamic / MPA v1.0.0)
URL: https://oceans-x.mpa.gov.sg/api/v1/vessel/departuredeclaration/1.0.0/pastNhours?datetime=2025-07-27%2000%3A00%3A00&hours=24

Name	Description
datetime *
string
(query)
Date and time in yyyy-MM-dd HH:mm:ss format

2025-07-27 00:00:00
hours *
string
(query)
Number of past hours to query (1-2 digits, optional decimal with up to 2 digits)

24

