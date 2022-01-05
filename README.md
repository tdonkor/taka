# DCI Teams - GIT Fork Workflow

This document provides basic information regarding the use of Acreburger boilerplate application and GIT fork workflow. This is the first draft and the document may suffer modifications.

## Current project structure

  
    ├── Acreburger                               # Boilerplate project
    │   ├── Bundle 1   			                 # Bundle project with different assets
	│	│   ├── Bundle 1 localization            # Bundle localization
	│	│   ├── Bundle 1 localization				
	│	│   ├── ...                 
    │   ├── Project 2				             # DOTXIX project based on Acreburger boilerplate
    │   ├── ...                     
  
**Acreburger** is the reference project. 
All new projects will fork from this repository unless they are part of a **DOTXIX bundle**. 

If the project is a **Bundle localization** that requires additional specific features, then the fork will be from the **Bundle** repository.
## How to fork a new project

To fork a project from Git Lab:

 1. Go to the repository that you want to fork from and press the fork button.
 2. You cannot fork a project in the same namespace. Thus, you will need to select a different group. Choose your own namespace if you plan to move the repository afterwards.
 3. Git Lab forks the repository with the same name. To change the name of the repository go to **Settings** and change **Project name** field.
 4. To change URL of repository go to **Advanced** and change **acreburger** to your desired name.
 5. To transfer the project to a different namespace/group, go to **Advanced** and select a new namespace/group from **Transfer project section**.


## How to update forked project

To be able to pull modifications from the main source, **first you need to add the source repository to your remote**.

    git remote add acreburger https://gitrepo.acrelec.com/dci/acreburger.git

To **pull** modifications from the **Acreburger** repository you need to fetch those changes.

    git fetch acreburger

Checkout to your desired branch (develop or feature).

To **merge** modifications from **Acreburger** master or other branch to your current branch:

    git merge acreburger/master

Change master to desired branch name or commit ID.

## How to remove fork connection

Go to your project **Settings**, in the **Remove fork relationship** section and press the button.

## How to release applications

The recommended git workflow is

**Master** -> Production branch
**Tags** -> Used to track release versions from master branch under v1.2.3 format
**Develop** -> Current development branch
**Feature** -> Specific functionality branch from the current development

![enter image description here](https://docs.gitlab.com/ee/topics/img/gitlab_flow_gitdashflow.png)

## How to add and use tags
A GIT tag is a pointer to a specific commit. It works similar to a branch because you can checkout to the tag, but you cannot modify sources. It helps to track important milestones in the repository and to keep a clean release history.

For a in depth guide on how to use tags please check the following resource:
[GIT official documentation](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

## Things to consider

Consider if the change should be done at **Acreburger** or **Localization** level.

Consider if it is worth updating from **Acreburger** repository and how it will impact the stability of your project.

Use automated test to check for regressions once you pull from **Acreburger** repository.

Keep track of your current project status in relation with the forked repository.