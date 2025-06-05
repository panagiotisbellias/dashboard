var TimingComponent = {
  props: ["modelValue"],
  setup(props, ctx) {
    let on_demand_model = ref({
      "disable_add": true
    })
    let advanced_reservation_model_end = ref({
      "disable_add": true,
    })
    let advanced_reservation_model_start = ref({})
    let periodic_model = ref({
      disable_add: true,
      schedule: "*/30 * * * *",
      duration_minutes: 10,
    })
    return {
      "types": [
        {
          "label": "On-demand",
          "value": "on_demand",
        },
        {
          "label": "In advance",
          "value": "advanced",
        },
        {
          "label": "Periodic",
          "value": "periodic",
        },

      ],
      new_type: ref("on_demand"),
      on_demand_model,
      advanced_reservation_model_end, advanced_reservation_model_start,
      periodic_model,
      timings: props.modelValue,
      delete_item(str) {
        let index = props.modelValue.indexOf(str)
        if (index !== -1) {
          props.modelValue.splice(index, 1)
          ctx.emit('update:modelValue', props.modelValue)
        }
      },
      add_on_demand() {
        let str = `type=on_demand,days=${on_demand_model.value.days},hours=${on_demand_model.value.hours},minutes=${on_demand_model.value.minutes}`
        props.modelValue.push(str)
        ctx.emit('update:modelValue', props.modelValue)
      },
      add_advanced() {
        // Encode the date objects with the ISO timezone.
        // TODO

        let start_d = advanced_reservation_model_start.value?.date
        let start_t = advanced_reservation_model_start.value?.time
        let s = new Date(`${start_d} ${start_t}`).toISOString()

        let end_d = advanced_reservation_model_end.value?.date
        let end_t = advanced_reservation_model_end.value?.time
        let e = new Date(`${end_d} ${end_t}`).toISOString()

        let str = `type=advanced,start=${s},end=${e}`
        props.modelValue.push(str)
        ctx.emit('update:modelValue', props.modelValue)
      },
      add_periodic() {
        let end_d = advanced_reservation_model_end.value?.date
        let end_t = advanced_reservation_model_end.value?.time
        let e = new Date(`${end_d} ${end_t}`).toISOString()

        let str = `type=periodic,end=${e},minutes=${periodic_model.value.duration_minutes},schedule=${periodic_model.value.schedule}`
        props.modelValue.push(str)
        ctx.emit('update:modelValue', props.modelValue)
      },
      model_expires_in: function (model, model_start){
        let s = Date.now()
        if (model_start) {
          let d = model_start.value?.date
          let t = model_start.value?.time
          if (d && t) {
            s = Date.parse(`${d} ${t}`)
          }
        }
        let d = model.value?.date
        let t = model.value?.time
        model.value.disable_add = true
        if (d && t) {
          let e = Date.parse(`${d} ${t}`)
          let diff = e - s
          if (e < Date.now()) {
            return "End date can not be in the past."
          } else if (diff > 0) {
            model.value.disable_add = false
            let days = Math.floor(diff / 1000 / 60 / 60 / 24);
            diff -= days * 1000 * 60 * 60 * 24

            let hours = Math.floor(diff / 1000 / 60 / 60);
            diff -= hours * 1000 * 60 * 60

            let minutes = Math.floor(diff / 1000 / 60);
            diff -= minutes * 1000 * 60

            model.value.days = days;
            model.value.hours = hours;
            model.value.minutes = minutes;

            return `Runs for ${days} days, ${hours} hours, ${minutes} minutes, beginning at ${new Date(s)}.`
          } else {
            return "Start date must be before end date."
          }
        } else {
          return "Expiration date not set."
        }
      },
      expires_in_calculation: function () {
        return this.model_expires_in(on_demand_model)
      },
      advanced_calculation: function () {
        return this.model_expires_in(
          advanced_reservation_model_end,
          advanced_reservation_model_start
        )
      },
      periodic_expires_in_calculation: function () {
        return this.model_expires_in(periodic_model)
      },
    }
  },
  template: `
    <div class="q-pa-sm">
      <h5>Timings</h5>
      <q-card>
        <q-card-section>
          <q-field
            v-model="timings"
            :rules="[ val => val && val.length >= 1 || 'Please add at least one timing from below.']"
          >
            <template v-slot:control>
              <ul>
                <li v-for="s in timings">
                  {{ s }} 
                  <q-btn
                    color="negative"
                    icon-right="delete"
                    no-caps
                    flat
                    dense
                    @click="delete_item(s)"
                  />
                </li>
                <li v-if="timings.length === 0">This job is never scheduled to run!</li>
              </ul>
            </template>
          </q-field>
        </q-card-section>

        <q-card-section>
          <h6>New timing</h6>

          <q-tabs v-model="new_type">
            <q-tab label="On-Demand" name="on_demand" />
            <q-tab label="In-Advance" name="advanced" />
            <q-tab label="Periodic" name="periodic" />
          </q-tabs>

          <q-tab-panels v-model="new_type">
            <q-tab-panel name="on_demand">
              <p>
                You are adding an on-demand timing to this job. 
                This will run your application now until a given expiration time.
                Please choose the expiration below.
              </p>
              <div class="q-gutter-md row items-start">
                <q-input filled v-model="on_demand_model.date" label="End time">
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover>
                        <div class="row q-gutter-md">
                          <div>
                            <q-date today-btn v-model="on_demand_model.date" mask="YYYY-MM-DD"></q-date>
                          </div>
                          <div>
                            <q-time now-btn v-model="on_demand_model.time" mask="hh:mm A"></q-time>
                          </div>
                        </div>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              <div>
                  <p>
                    {{ expires_in_calculation() }}
                  </p>
                  <q-btn
                    color="primary"
                    icon-right="add"
                    @click="add_on_demand(s)"
                    :disable="on_demand_model.disable_add"
                  >Add</q-btn>
                </div>
              </div> 
            </q-tab-panel>         
            <q-tab-panel name="advanced">
              <p>
                You are adding an advance timing to this job. 
                This will run your application a given start time to an end time.
              </p>
              <div class="q-gutter-md row items-start">
                <q-input filled v-model="advanced_reservation_model_start.date" label="Start">
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover>
                        <div class="row q-gutter-md">
                          <div>
                            <q-date today-btn v-model="advanced_reservation_model_start.date" mask="YYYY-MM-DD"></q-date>
                          </div>
                          <div>
                            <q-time now-btn v-model="advanced_reservation_model_start.time" mask="hh:mm A"></q-time>
                          </div>
                        </div>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-input filled v-model="advanced_reservation_model_end.date" label="End">
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover>
                        <div class="row q-gutter-md">
                          <div>
                            <q-date today-btn v-model="advanced_reservation_model_end.date" mask="YYYY-MM-DD"></q-date>
                          </div>
                          <div>
                            <q-time now-btn v-model="advanced_reservation_model_end.time" mask="hh:mm A"></q-time>
                          </div>
                        </div>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <div>
                  <p>
                    {{ advanced_calculation() }}
                  </p>
                  <q-btn
                    color="primary"
                    icon-right="add"
                    @click="add_advanced()"
                    :disable="advanced_reservation_model_end.disable_add"
                  >Add</q-btn>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="periodic">
              <p>
                You are adding a periodic timing to this job. 
                This will run your application for a given duration periodically,
                until the given end date
              </p>
              <div class="q-gutter-md row items-start">
                <q-input filled v-model="periodic_model.date" label="End time">
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover>
                        <div class="row q-gutter-md">
                          <div>
                            <q-date today-btn v-model="periodic_model.date" mask="YYYY-MM-DD"></q-date>
                          </div>
                          <div>
                            <q-time now-btn v-model="periodic_model.time" mask="hh:mm A"></q-time>
                          </div>
                        </div>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-input filled v-model="periodic_model.duration_minutes" label="Duration (minutes)"></q-input>
                <q-input filled v-model="periodic_model.schedule" label="Cron schedule"></q-input>
              <div>
                  <p>
                    {{ periodic_expires_in_calculation() }}
                  </p>
                  <q-btn
                    color="primary"
                    icon-right="add"
                    @click="add_periodic(s)"
                    :disable="periodic_model.disable_add"
                  >Add</q-btn>
                </div>
              </div> 
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </div>
    `
}
