## Ussage

To use this library, just add a new step into your workflow as follow:

```yaml
- name: Checking Service Availability
  uses: cebroker/health-availability-action@master
  with:
    apps_inventory_url: 'https://your-health-api.com/app/service_name?sections=health?secondsAgo=60'
    apps_inventory_auth: 'zeD3qUwspYmzPyUcE7fKE8jT2qUgCrWd'
    allow_warn_as_passed: true
    availability_percentage: 80
- run: echo ${{ steps.foo.outputs.summary }}
- name: Send secrets to k8s
  run: kubectl apply -f output.yaml
```

### Params

```yaml
apps_inventory_url:
  required: true
  description: 'Host and Path of your Apps Inventory Health Section'
apps_inventory_auth:
  description: 'Your internal API Key to consult health information'
  required: true
availability_percentage:
  required: true
  description: 'Percentage of your healthy machines. If its less than provided the action will exit with status code 1'
allow_warn_as_passed:
  required: false
  default: true
  description: 'set false if you only want to count pass status as availability'
```

## Contributors

The original author and current lead maintainer of this module is the [@condor-labs development team](https://condorlabs.io/team).

Join to our team.

**Join to our Team [Here](https://condorlabs.io/hiring).**

**More about Condorlabs [Here](https://condorlabs.io/about).**

## License

[MIT](LICENSE)
