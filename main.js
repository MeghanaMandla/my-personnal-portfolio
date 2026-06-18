var typed = new Typed(".text", {
    strings: [
        "Computer Science Student",
        "Python Developer",
        "DevOps Enthusiast",
        "Machine Learning Enthusiast",
        "Frontend Developer"
    ],
    typeSpeed: 100,
    backSpeed: 80,
    backDelay: 1500,
    loop: true
});


const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {

    const updateCounter = () => {

        const target = +counter.getAttribute("data-target");
        const count = +counter.innerText;
        const increment = target / 100;

        if(count < target){
            counter.innerText = Math.ceil(count + increment);
            setTimeout(updateCounter, 20);
        } else {
            counter.innerText = target;
        }

    };

    updateCounter();

});


/* CUSTOM CURSOR */

const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
});


/* THEME TOGGLE */

const toggle = document.getElementById("theme-toggle");

toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
});
