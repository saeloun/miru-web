# Device APIs

> TODO : Authentication related details will be shared soon.

### 1. Register Device

POST {{base_url}}/device_api/devices

Request payload :
```
{
    "device":{
        "name": "A50",
        "version": "Pro",
        "version_id": "1213",
        "manufacturer": "Samsung",
        "base_os": "android",
        "brand": "Samsung",
        "device_type": "mobile",
        "serial_number": "334455123123",
        "company_id": 1,
        "user_id": 1
    }
}

```

Example Response :
```
200 Ok
{
    "id": 3,
    "available": true,
    "base_os": "android",
    "brand": "Samsung",
    "device_type": "mobile",
    "manufacturer": "Samsung",
    "meta_details": null,
    "name": "A50",
    "serial_number": "334455123123",
    "specifications": null,
    "version": "Pro",
    "assignee": null,
    "company": {
        "id": 1,
        "name": "Saeloun India Pvt. Ltd",
        "address": "somewhere in India",
        "business_phone": "+91 0000000000",
        "base_currency": "INR",
        "standard_price": "100000.0",
        "fiscal_year_end": "apr-mar",
        "date_format": "DD-MM-YYYY",
        "country": "IN",
        "timezone": "Asia - Kolkata",
        "created_at": "2022-05-26T07:21:17.559Z",
        "updated_at": "2022-05-26T07:23:48.907Z"
    },
    "user": {
        "id": 1,
        "first_name": "Vipul",
        "last_name": "A M",
        "email": "vipul@example.com",
        "created_at": "2022-05-26T07:23:49.224Z",
        "updated_at": "2022-05-26T07:23:49.224Z",
        "current_workspace_id": 1,
        "discarded_at": null,
        "personal_email_id": null,
        "date_of_birth": null,
        "social_accounts": null,
        "department_id": null,
        "phone": null
    },
    "version_id": "1213"
}
```

### 2. Update availability for device : On/Off

PUT {{url}}/device_api/devices/3

Request data :
```
{
    "device":{
        "available": false
    }
}
```

Example Response :
```
200 Ok
{
    "success": true,
    "device": {
        "available": false,
        "id": 3,
        "user_id": 1,
        "company_id": 1,
        "device_type": "mobile",
        "name": "A50",
        "serial_number": "334455123123",
        "specifications": null,
        "created_at": "2022-08-23T07:33:38.723Z",
        "updated_at": "2022-08-23T07:34:54.476Z",
        "assignee_id": 2,
        "version": "Pro",
        "version_id": "1213",
        "brand": "Samsung",
        "manufacturer": "Samsung",
        "base_os": "android",
        "meta_details": null
    },
    "notice": "Changes saved successfully"
}
```

### 3. Approve Device Usages

POST {{base_url}}/device_api/devices/:id/approve_usages

Example Response :
```
200 Ok
{
    "id": 4,
    "device": {
        "id": 3,
        "user_id": 1,
        "company_id": 1,
        "device_type": "mobile",
        "name": "A50",
        "serial_number": "334455123123",
        "specifications": null,
        "created_at": "2022-08-23T07:33:38.723Z",
        "updated_at": "2022-08-23T07:34:54.476Z",
        "assignee_id": 2,
        "available": true,
        "version": "Pro",
        "version_id": "1213",
        "brand": "Samsung",
        "manufacturer": "Samsung",
        "base_os": "android",
        "meta_details": null
    },
    "assignee": {
        "id": 2,
        "first_name": "Supriya",
        "last_name": "Agarwal",
        "email": "supriya@example.com",
        "created_at": "2022-05-26T07:23:49.487Z",
        "updated_at": "2022-05-26T07:34:26.621Z",
        "current_workspace_id": 1,
        "discarded_at": null,
        "personal_email_id": null,
        "date_of_birth": null,
        "social_accounts": null,
        "department_id": null,
        "phone": null
    },
    "created_by": null,
    "approve": true
}
```
