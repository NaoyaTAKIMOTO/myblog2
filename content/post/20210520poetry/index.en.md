---
title: "Building a python environment with poetry on mac os"
description: ""
date: "2021-05-20T20:53:52+09:00"
thumbnail: "/img/man-593333_1920.jpg"
tags: [build environment,python]
---
Pip is a major method of installing python libraries.

poetry is a more advanced version control tool for development environments.

It seems to have official support for pyenv integration.

I'll write down how to install it on mac os and what I got stuck.
## Advantages of poetry
- Can organize library dependencies.
  - There are some unexpected side effects depending on the version of the library.
  - Trying to recreate the environment can cause errors with library versions and installation order.
  - Building the environment is an inevitable part of human work, so it should be automated if possible.
  - Also, it seems to be able to update the library version to take dependencies into account.
  - And it keeps a record of the status.
- Is it possible to separate the dependency records by git branch?
- The libraries you can install are comparable to pip
  - Does it have the same references as pypy?
- Usability is not much different from pip
  - Poetry add instead of pip install
- It recognizes virtual environments created with pyenv and works with them.

I'm going to install it because it seems to be a convenient way to build an environment without much effort.

## How to install
For mac os, execute the following command.

    curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -

Add the following line to .zprofile and pass the path to zsh.
```sh
export PATH="HOME/.poetry/bin:$PATH"
````

Confirm that the installation is successful with the following command.

    poetry --version

## Usage
- Create a project

    poetry new projec_name

Some stuff will be generated.

If you already have a directory

    poetry init

- Setting up a virtual environment

poetry will set up the virtual environment on its own, just like virtualenv does.
1. install the python you want to use

    pyenv install some.ver.sion

2. activate any python in the project directory

    pyenv local some.ver.sion 3.

3. specify any python in poetry (optional?)

    poetry env use some.ver.sion

- Install the library

    poetry add library_name

- Reproduce the environment
Execute the following command in the directory containing poetry.lock

    poetry install

## where you are stuck
- Install poetry with homebrew
  - I don't know about you, but I couldn't get python to work.
  - It seemed to be tied to the system default python environment, not the pyenv virtual environment.
- Update pyenv itself
  - The version of python that can be installed with pyenv was too old
  - Solved with git pull
- The path to zsh needs to be passed manually
  - When I installed poetry, I thought I saw something like "I've set the environment variables! but it seems that it is not set automatically

If you don't need to fiddle with ## requirements.txt, why not?
- Introducing poetry is not that difficult.
- Running poetry itself seems easy.
- It's good to be able to reproduce the environment with dependencies in mind.
- Passing is good

## Question
- How do you use private repositories?

Translated with www.DeepL.com/Translator (free version)