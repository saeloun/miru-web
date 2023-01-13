/* eslint-disable */
import React from "react";
import Calendar from "react-calendar";

// import dayjs from "dayjs";
// import { CalendarIcon, DeleteIcon } from "miruIcons";
// import Select from "react-select";

// import CustomDatePicker from "common/CustomDatePicker";
import { Divider } from "common/Divider";
// import Loader from "common/Loader/index";
// import Toastr from "common/Toastr";
// import { leaveTypes } from "constants/leaveType";
// import { sendGAPageView } from "utils/googleAnalytics";

// import Header from "../../Header";
// import { Tooltip } from "StyledComponents";

const Details = () => {
  // console.log(new Date().toJSON().slice(0, 10))
  let tileContent = ({ date }) => {
    // console.log(date, "<<");
    if (true) {
      // console.log(date, "<<");
      return (
        <button
          data-bs-toggle="tooltip"
          data-bs-placement="right"
          title="Tooltip on right"
        >
          {date.getDate()}
        </button>
      );
    }
    //  else {
    //   return null
    // }
  };

  const mark = ["2023-01-12", "2023-02-15", "2023-01-20"];

  // console.log(new Date(mark[0]).toJSON().slice(0, 10))

  return (
    <div className="mt-4 h-full bg-miru-gray-100 p-10">
      <div className="flex w-full flex-row py-6">
        <div className="w-3/12 p-2 text-sm">Leave Balance</div>
        <div className="w-3/12 p-2">
          <div className="text-xs">Leave type</div>
          <div className="text-base">Annual leaves</div>
        </div>
        <div className="w-3/12 p-2">
          <div className="text-xs">Total</div>
          <div className="text-base">2 days per month</div>
        </div>
        <div className="w-3/12 p-2">
          <div className="text-xs">Carry forward</div>
          <div className="text-base">5 days</div>
        </div>
      </div>
      <Divider />
      <div className="flex w-full flex-row py-6">
        <div className="w-3/12 p-2 text-sm">Holidays</div>
        <div className="flex w-9/12 flex-row">
          <div className="w-1/2 p-2">
            <div className="text-xs">Date</div>
            <div className="text-base">01.01.2022</div>
          </div>
          <div className="w-1/2 p-2">
            <div className="text-xs">Name</div>
            <div className="text-base">Independence day</div>
          </div>
        </div>
      </div>
      <Divider />
      <div className="flex w-full flex-row py-6">
        <div className="w-3/12 p-2 text-sm">Optional Holidays</div>
        <div className="w-9/12">
          <div className="p-2">
            <div className="text-xs">Total optional holidays</div>
            <div className="text-base">1 per quarter</div>
          </div>
          <div className="flex w-full flex-row">
            <div className="w-1/2 p-2">
              <div className="text-xs">Date</div>
              <div className="text-base">01.01.2022</div>
            </div>
            <div className="w-1/2 p-2">
              <div className="text-xs">Name</div>
              <div className="text-base">Independence day</div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal__modal main-modal"
        style={{ background: "rgba(29, 26, 49,0.6)" }}
      >
        <div className="modal__container modal-container overflow-y-auto; z-50 mx-auto w-full max-w-4xl rounded-xl bg-white shadow-lg">
          <div className="modal__content modal-content max-h-90v overflow-y-auto">
            <div className="modal__position">
              <h6 className="modal__title"> Add New Project </h6>
              <div className="modal__close">
                {/* <button
                  className="modal__button"
                  onClick={() => {
                    setShowProjectModal(false);
                  }}
                >
                  <XIcon color="#CDD6DF" size={15} />
                </button> */}
              </div>
            </div>
            <div className="modal__form flex-col">
              <button
                className="text-miru-han-purple-1000"
                // onClick={() => setIsSending(!isSending)}
                data-bs-placement="right"
                data-bs-toggle="tooltip"
                title="Tooltip on right"
              >
                Hello
              </button>

              <div className="flex flex-row justify-around">
                <div key={1}>
                  <Calendar
                    showNavigation={false}
                    // tileClassName={ }
                    className={"react-calendar-month-picker relative max-h-64"}
                    tileContent={tileContent}
                    tileClassName={({ date }) => {
                      //eslint-disable-line
                      if (
                        mark.find(
                          x => x === new Date(date).toJSON().slice(0, 10)
                        )
                      ) {
                        return "highlight";
                      }
                      // else {
                      //   // console.log(date)
                      //   return "date-calendar"
                      // }
                    }}
                    value={new Date(2023, 0, 1)}
                  />
                </div>
                {/* <div key={2}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 1, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
                <div key={3}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 2, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div> */}
              </div>
              {/* <div className="flex flex-row justify-around">
                <div key={4}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 3, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
                <div key={5}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 4, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
                <div key={6}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 5, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
              </div>
              <div className="flex flex-row justify-around">
                <div key={7}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 6, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
                <div key={8}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 7, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
                <div key={9}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 8, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
              </div>
              <div className="flex flex-row justify-around">
                <div key={10}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 9, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
                <div key={11}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 10, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
                <div key={12}>
                  <Calendar
                    showNavigation={false}
                    value={new Date(2023, 11, 1)}
                    className={"react-calendar-month-picker max-h-64"}
                  // tileClassName={ }
                  />
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
