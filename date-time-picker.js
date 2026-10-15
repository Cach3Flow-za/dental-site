const pickerWidgets = [...document.querySelectorAll(".picker-control")];

const formatIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const closePicker = (picker, restoreFocus = false) => {
  const panel = picker.querySelector("[data-picker-panel]");
  const trigger = picker.querySelector(".picker-trigger");

  panel.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  picker.classList.remove("is-open");

  if (restoreFocus) {
    trigger.focus();
  }
};

const closeOtherPickers = (activePicker) => {
  pickerWidgets.forEach((picker) => {
    if (picker !== activePicker && !picker.querySelector("[data-picker-panel]").hidden) {
      closePicker(picker);
    }
  });
};

const initializeDatePicker = (picker) => {
  const panel = picker.querySelector("[data-picker-panel]");
  const trigger = picker.querySelector(".picker-trigger");
  const input = picker.querySelector("[data-picker-input]");
  const label = picker.querySelector("[data-picker-label]");
  const heading = picker.querySelector("[data-calendar-heading]");
  const daysContainer = picker.querySelector("[data-calendar-days]");
  const error = picker.querySelector("[data-picker-error]");
  const now = new Date();
  let displayedMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const renderCalendar = () => {
    heading.textContent = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(displayedMonth);
    daysContainer.replaceChildren();

    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let index = 0; index < firstWeekday; index += 1) {
      const spacer = document.createElement("span");
      spacer.className = "calendar-day-spacer";
      spacer.setAttribute("aria-hidden", "true");
      daysContainer.append(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dateValue = formatIsoDate(date);
      const dayButton = document.createElement("button");
      dayButton.className = "calendar-day";
      dayButton.type = "button";
      dayButton.textContent = String(day);
      dayButton.setAttribute("aria-label", formatDisplayDate(date));
      dayButton.setAttribute("aria-pressed", String(input.value === dateValue));

      if (input.value === dateValue) {
        dayButton.classList.add("is-selected");
      }

      if (formatIsoDate(now) === dateValue) {
        dayButton.classList.add("is-today");
      }

      dayButton.addEventListener("click", () => {
        input.value = dateValue;
        label.textContent = formatDisplayDate(date);
        if (error) {
          error.hidden = true;
        }
        trigger.removeAttribute("aria-invalid");
        closePicker(picker, true);
      });

      daysContainer.append(dayButton);
    }
  };

  picker.querySelector("[data-calendar-prev]").addEventListener("click", () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  picker.querySelector("[data-calendar-next]").addEventListener("click", () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  trigger.addEventListener("click", () => {
    closeOtherPickers(picker);
    const isOpening = panel.hidden;
    panel.hidden = !isOpening;
    trigger.setAttribute("aria-expanded", String(isOpening));
    picker.classList.toggle("is-open", isOpening);

    if (isOpening) {
      const selectedDate = input.value ? new Date(`${input.value}T00:00:00`) : new Date();
      displayedMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      renderCalendar();
      picker.querySelector("[data-calendar-prev]").focus();
    }
  });
};

const initializeTimePicker = (picker) => {
  const panel = picker.querySelector("[data-picker-panel]");
  const trigger = picker.querySelector(".picker-trigger");
  const input = picker.querySelector("[data-picker-input]");
  const label = picker.querySelector("[data-picker-label]");
  const heading = picker.querySelector("[data-clock-heading]");
  const stageLabel = picker.querySelector("[data-clock-stage]");
  const valuesContainer = picker.querySelector("[data-clock-values]");
  const hand = picker.querySelector("[data-clock-hand]");
  const confirmButton = picker.querySelector("[data-clock-confirm]");
  const backButton = picker.querySelector("[data-clock-back]");
  const error = picker.querySelector("[data-picker-error]");
  let hour = null;
  let minute = null;
  let period = "AM";
  let stage = "hour";

  const setHandAngle = (value, unit) => {
    const angle = unit === "hour" ? (value % 12) * 30 : (value / 5) * 30;
    hand.style.setProperty("--hand-angle", `${angle}deg`);
  };

  const updatePeriodButtons = () => {
    picker.querySelectorAll("[data-period]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.period === period));
    });
  };

  const renderClock = () => {
    const choosingHour = stage === "hour";
    heading.textContent = choosingHour ? "Choose hour" : "Choose minutes";
    stageLabel.textContent = choosingHour ? "Select an hour" : "Select a 5-minute interval";
    backButton.hidden = choosingHour;
    confirmButton.disabled = hour === null || minute === null;
    valuesContainer.replaceChildren();

    const values = choosingHour
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : Array.from({ length: 12 }, (_, index) => index * 5);

    values.forEach((value, index) => {
      const button = document.createElement("button");
      const angle = (index * 30 * Math.PI) / 180;
      button.className = "clock-value";
      button.type = "button";
      button.textContent = choosingHour ? String(value) : String(value).padStart(2, "0");
      button.style.left = `${50 + Math.sin(angle) * 39}%`;
      button.style.top = `${50 - Math.cos(angle) * 39}%`;
      button.setAttribute("aria-pressed", String(choosingHour ? hour === value : minute === value));

      if ((choosingHour && hour === value) || (!choosingHour && minute === value)) {
        button.classList.add("is-selected");
      }

      button.addEventListener("click", () => {
        if (choosingHour) {
          hour = value;
          minute = null;
          stage = "minute";
          setHandAngle(hour, "hour");
        } else {
          minute = value;
          setHandAngle(minute, "minute");
        }
        renderClock();
      });

      valuesContainer.append(button);
    });
  };

  picker.querySelectorAll("[data-period]").forEach((button) => {
    button.addEventListener("click", () => {
      period = button.dataset.period;
      updatePeriodButtons();
    });
  });

  backButton.addEventListener("click", () => {
    stage = "hour";
    minute = null;
    renderClock();
  });

  confirmButton.addEventListener("click", () => {
    if (hour === null || minute === null) {
      return;
    }

    const hour24 = (hour % 12) + (period === "PM" ? 12 : 0);
    input.value = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    label.textContent = `${hour}:${String(minute).padStart(2, "0")} ${period}`;
    if (error) {
      error.hidden = true;
    }
    trigger.removeAttribute("aria-invalid");
    closePicker(picker, true);
  });

  trigger.addEventListener("click", () => {
    closeOtherPickers(picker);
    const isOpening = panel.hidden;
    panel.hidden = !isOpening;
    trigger.setAttribute("aria-expanded", String(isOpening));
    picker.classList.toggle("is-open", isOpening);

    if (isOpening) {
      if (input.value) {
        const [hour24, selectedMinute] = input.value.split(":").map(Number);
        period = hour24 >= 12 ? "PM" : "AM";
        hour = hour24 % 12 || 12;
        minute = selectedMinute;
      } else {
        hour = null;
        minute = null;
        period = "AM";
      }
      stage = "hour";
      updatePeriodButtons();
      setHandAngle(hour ?? 12, "hour");
      renderClock();
      picker.querySelector("[data-period='AM']").focus();
    }
  });
};

pickerWidgets.forEach((picker) => {
  if (picker.dataset.picker === "date") {
    initializeDatePicker(picker);
  } else if (picker.dataset.picker === "time") {
    initializeTimePicker(picker);
  }
});

document.addEventListener("click", (event) => {
  const eventPath = event.composedPath();

  pickerWidgets.forEach((picker) => {
    if (!eventPath.includes(picker) && !picker.querySelector("[data-picker-panel]").hidden) {
      closePicker(picker);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  const openPicker = pickerWidgets.find((picker) => !picker.querySelector("[data-picker-panel]").hidden);
  if (openPicker) {
    event.preventDefault();
    closePicker(openPicker, true);
  }
});

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    const missingPicker = [...form.querySelectorAll("[data-picker-required]")].find(
      (picker) => !picker.querySelector("[data-picker-input]").value,
    );

    if (missingPicker) {
      event.preventDefault();
      const error = missingPicker.querySelector("[data-picker-error]");
      error.hidden = false;
      missingPicker.querySelector(".picker-trigger").setAttribute("aria-invalid", "true");
      missingPicker.querySelector(".picker-trigger").focus();
    }
  });
});
