# Usage 

```
action: flavioaandres/health-monitor-action@v1
```

```yaml
  apps_inventory_url:
    required: true
    description: 'Host and Path of your Apps Inventory Health Section'
  apps_inventory_auth: 
    description: 'Your internal API Key to consult health information'
    required: true
  availability_percentage: 
    required: true
    description: 'number of the % of your healthy machines. If its less than provided'
```